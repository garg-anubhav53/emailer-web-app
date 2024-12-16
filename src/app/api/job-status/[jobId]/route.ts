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
  _request: NextRequest,
  { params }: { params: { jobId: string } }
): Promise<NextResponse> {
  try {
    const { data: job, error: supabaseError } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', params.jobId)
      .single();

    if (supabaseError) {
      console.error('Error fetching job status:', supabaseError);
      return NextResponse.json({ 
        message: 'Error fetching job status',
        error: supabaseError.message 
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
    console.error('Error processing job status request:', error);
    return NextResponse.json({ 
      message: 'Error processing request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
