import { NextRequest, NextResponse } from 'next/server';
import { sendEmails } from '@/utils/emailSender';
import path from 'path';
import { writeFile } from 'fs/promises';

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

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, csvFile.name);

    // Convert File to Buffer and save it
    const bytes = await csvFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    try {
      const result = await sendEmails(filePath, {
        smtpUsername,
        smtpPassword,
        senderName,
        smtpServer,
        smtpPort,
        scheduledTime: scheduledTime || null,
        emailDelay
      });

      // Clean up the uploaded file
      await writeFile(filePath, ''); // Clear file contents
      
      return NextResponse.json({
        message: 'Emails sent successfully',
        ...result
      });
    } catch (error) {
      console.error('Error sending emails:', error);
      return NextResponse.json({ 
        message: 'Error sending emails', 
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      message: 'Error processing request', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
