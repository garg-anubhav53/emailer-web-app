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
  { params }: { params: { jobId: string } }
): Promise<NextResponse> {
  return NextResponse.json({ jobId: params.jobId });
}
