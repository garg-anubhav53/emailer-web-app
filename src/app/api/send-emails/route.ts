create table email_jobs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  scheduled_time timestamp with time zone not null,
  email_delay integer not null,
  smtp_config jsonb not null,
  csv_data jsonb not null,
  status text not null default 'pending',
  completed_emails integer not null default 0,
  failed_emails integer not null default 0,
  total_emails integer not null,
  error text
);

-- Add row level security policies
alter table email_jobs enable row level security;

-- Allow public access for now (you might want to add authentication later)
create policy "Allow public access to email_jobs"
  on email_jobs for all
  using (true)
  with check (true);import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
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

    // Create email job in Supabase
    const { data: job, error } = await supabase
      .from('email_jobs')
      .insert({
        scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString(),
        email_delay: emailDelay,
        smtp_config: {
          username: smtpUsername,
          password: smtpPassword,
          server: smtpServer,
          port: smtpPort,
          sender_name: senderName
        },
        csv_data: csvData,
        status: 'pending',
        completed_emails: 0,
        failed_emails: 0,
        total_emails: csvData.length
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json({ 
        message: 'Error creating email job',
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Email job created successfully',
      jobId: job.id,
      totalEmails: csvData.length,
      scheduledTime: job.scheduled_time
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      message: 'Error processing request', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
