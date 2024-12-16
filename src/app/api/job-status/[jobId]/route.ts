import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { data: job, error } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', params.jobId)
      .single();

    if (error) {
      return NextResponse.json({ 
        message: 'Error fetching job status',
        error: error.message 
      }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({ 
        message: 'Job not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      completedEmails: job.completed_emails,
      failedEmails: job.failed_emails,
      totalEmails: job.total_emails,
      scheduledTime: job.scheduled_time,
      error: job.error
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json({ 
      message: 'Error fetching job status',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
