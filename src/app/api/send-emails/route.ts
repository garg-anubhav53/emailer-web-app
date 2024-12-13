import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/database';
import { EmailJob } from '@/models/EmailJob';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface CSVRow {
  firstName: string;
  email: string;
  subject: string;
  body: string;
}

async function parseCsvBuffer(buffer: Buffer): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const results: CSVRow[] = [];
    const readable = Readable.from(buffer);
    readable
      .pipe(csv({
        mapHeaders: ({ header }) => {
          const h = header.toLowerCase().trim();
          if (h === 'first name' || h === 'firstname' || h === 'first_name') return 'firstName';
          if (h === 'email' || h === 'email address' || h === 'emailaddress') return 'email';
          if (h === 'subject' || h === 'email subject') return 'subject';
          if (h === 'body' || h === 'email body' || h === 'message') return 'body';
          return h;
        }
      }))
      .on('data', (data: any) => {
        if (data.firstName && data.email && data.subject && data.body) {
          results.push({
            firstName: data.firstName.trim(),
            email: data.email.trim(),
            subject: data.subject.trim(),
            body: data.body.trim()
          });
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const csvFile = formData.get('csvFile') as File;
    const smtpUsername = formData.get('smtpUsername') as string;
    const smtpPassword = formData.get('smtpPassword') as string;
    const senderName = formData.get('senderName') as string;
    const smtpServer = formData.get('smtpServer') as string;
    const smtpPort = parseInt(formData.get('smtpPort') as string, 10);
    const scheduledTime = formData.get('scheduledTime') as string;
    const emailDelay = parseInt(formData.get('emailDelay') as string, 10);

    if (!csvFile || !smtpUsername || !smtpPassword || !senderName || !smtpServer || !smtpPort || !emailDelay) {
      return NextResponse.json({ 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    if (scheduledTime) {
      const scheduledDate = new Date(scheduledTime);
      const now = new Date();
      if (scheduledDate <= now) {
        return NextResponse.json({ 
          message: 'Scheduled time must be in the future' 
        }, { status: 400 });
      }
    }

    if (emailDelay < 1 || emailDelay > 3600) {
      return NextResponse.json({ 
        message: 'Email delay must be between 1 and 3600 seconds' 
      }, { status: 400 });
    }

    // Convert File to Buffer and parse CSV
    const bytes = await csvFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const csvData = await parseCsvBuffer(buffer);

    if (csvData.length === 0) {
      return NextResponse.json({ 
        message: 'No valid email data found in CSV' 
      }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Create email job
    const emailJob = await EmailJob.create({
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      emailDelay,
      smtpConfig: {
        username: smtpUsername,
        password: smtpPassword,
        server: smtpServer,
        port: smtpPort,
        senderName
      },
      csvData,
      status: 'pending'
    });

    return NextResponse.json({
      message: 'Email job created successfully',
      jobId: emailJob._id,
      totalEmails: csvData.length,
      scheduledTime: emailJob.scheduledTime
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      message: 'Error processing request', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
