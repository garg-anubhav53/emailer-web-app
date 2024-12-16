import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import nodemailer from 'nodemailer';

interface SMTPConfig {
  server: string;
  port: number;
  username: string;
  password: string;
  sender_name: string;
}

interface EmailJob {
  id: string;
  smtp_config: SMTPConfig;
  csv_data: Array<{
    firstName: string;
    email: string;
    subject: string;
    body: string;
  }>;
  completed_emails: number;
  failed_emails: number;
  total_emails: number;
  email_delay: number;
  status: string;
  scheduled_time: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const maxDuration = 300; // 5 minutes maximum execution time
export const dynamic = 'force-dynamic';

async function processJob(job: EmailJob) {
  const transporter = nodemailer.createTransport({
    host: job.smtp_config.server,
    port: job.smtp_config.port,
    secure: true,
    auth: {
      user: job.smtp_config.username,
      pass: job.smtp_config.password
    }
  });

  let completedCount = job.completed_emails;
  let failedCount = job.failed_emails;

  try {
    // Update job status to processing
    await supabase
      .from('email_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id);

    for (const email of job.csv_data) {
      try {
        await transporter.sendMail({
          from: `${job.smtp_config.sender_name} <${job.smtp_config.username}>`,
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
      await supabase
        .from('email_jobs')
        .update({
          completed_emails: completedCount,
          failed_emails: failedCount
        })
        .eq('id', job.id);

      if (job.csv_data.indexOf(email) < job.csv_data.length - 1) {
        await sleep(job.email_delay * 1000);
      }
    }

    // Mark job as completed
    await supabase
      .from('email_jobs')
      .update({
        status: 'completed',
        completed_emails: completedCount,
        failed_emails: failedCount
      })
      .eq('id', job.id);
  } catch (error) {
    // Mark job as failed
    await supabase
      .from('email_jobs')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        completed_emails: completedCount,
        failed_emails: failedCount
      })
      .eq('id', job.id);
  }
}

export async function GET() {
  try {
    // Find pending jobs that are scheduled for now or in the past
    const { data: jobs, error } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', new Date().toISOString())
      .limit(5);

    if (error) {
      throw error;
    }

    // Process each job
    for (const job of jobs || []) {
      await processJob(job);
    }

    return NextResponse.json({
      message: 'Jobs processed successfully',
      jobsProcessed: jobs?.length || 0
    });
  } catch (error) {
    console.error('Error processing jobs:', error);
    return NextResponse.json({ 
      message: 'Error processing jobs',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
