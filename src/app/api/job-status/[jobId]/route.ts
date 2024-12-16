import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

interface EmailJob {
  id: string;
  status: string;
  completed_emails: number;
  failed_emails: number;
  total_emails: number;
  error?: string;
}

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { jobId: string } }
): Promise<NextResponse> {
  try {
    const { data: job, error } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', context.params.jobId)
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

    const jobStatus: Partial<EmailJob> = {
      status: job.status,
      completed_emails: job.completed_emails,
      failed_emails: job.failed_emails,
      total_emails: job.total_emails,
    };

    if (job.error) {
      jobStatus.error = job.error;
    }

    return NextResponse.json(jobStatus);
  } catch (error) {
    return NextResponse.json({ 
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}
