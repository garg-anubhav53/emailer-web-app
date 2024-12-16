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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ 
      message: 'Job ID is required' 
    }, { status: 400 });
  }

  try {
    const { data: job, error } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('id', jobId)
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
      message: 'Error processing request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
