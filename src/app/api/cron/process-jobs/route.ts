import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/database';
import { EmailJob } from '@/models/EmailJob';
import nodemailer from 'nodemailer';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const maxDuration = 300; // 5 minutes maximum execution time
export const dynamic = 'force-dynamic';

async function processJob(job: any) {
  const transporter = nodemailer.createTransport({
    host: job.smtpConfig.server,
    port: job.smtpConfig.port,
    secure: true,
    auth: {
      user: job.smtpConfig.username,
      pass: job.smtpConfig.password
    }
  });

  let completedCount = 0;
  let failedCount = 0;

  try {
    for (const email of job.csvData) {
      try {
        await transporter.sendMail({
          from: `${job.smtpConfig.senderName} <${job.smtpConfig.username}>`,
          to: email.email,
          subject: email.subject,
          html: `<div><p>Hi ${email.firstName},</p>${email.body}</p></div>`
        });
        completedCount++;
      } catch (error) {
        console.error(`Failed to send email to ${email.email}:`, error);
        failedCount++;
      }

      // Update job progress
      await EmailJob.findByIdAndUpdate(job._id, {
        completedEmails: completedCount,
        failedEmails: failedCount
      });

      if (job.csvData.indexOf(email) < job.csvData.length - 1) {
        await sleep(job.emailDelay * 1000);
      }
    }

    // Mark job as completed
    await EmailJob.findByIdAndUpdate(job._id, {
      status: 'completed',
      completedEmails: completedCount,
      failedEmails: failedCount
    });
  } catch (error) {
    // Mark job as failed
    await EmailJob.findByIdAndUpdate(job._id, {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      completedEmails: completedCount,
      failedEmails: failedCount
    });
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    // Find pending jobs that are scheduled for now or in the past
    const jobs = await EmailJob.find({
      status: 'pending',
      scheduledTime: { $lte: new Date() }
    }).limit(5); // Process 5 jobs at a time

    // Process each job
    for (const job of jobs) {
      // Mark job as processing
      await EmailJob.findByIdAndUpdate(job._id, { status: 'processing' });
      
      // Process the job
      await processJob(job);
    }

    return NextResponse.json({
      message: 'Jobs processed successfully',
      jobsProcessed: jobs.length
    });
  } catch (error) {
    console.error('Error processing jobs:', error);
    return NextResponse.json({ 
      message: 'Error processing jobs',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
