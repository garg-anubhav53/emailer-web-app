import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/database';
import { EmailJob } from '@/models/EmailJob';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await connectToDatabase();
    const job = await EmailJob.findById(params.jobId);

    if (!job) {
      return NextResponse.json({ 
        message: 'Job not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      completedEmails: job.completedEmails,
      failedEmails: job.failedEmails,
      totalEmails: job.csvData.length,
      scheduledTime: job.scheduledTime,
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
