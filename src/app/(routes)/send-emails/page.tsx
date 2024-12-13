'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedEmails: number;
  failedEmails: number;
  totalEmails: number;
  scheduledTime: string;
  error?: string;
}

export default function SendEmails() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    smtpUsername: '',
    smtpPassword: '',
    senderName: '',
    smtpServer: '',
    smtpPort: '587',
    scheduledTime: '',
    emailDelay: '5'
  });

  useEffect(() => {
    let statusInterval: NodeJS.Timeout;

    if (jobId && jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed') {
      statusInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/job-status/${jobId}`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch job status');
          }

          setJobStatus(data);

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(statusInterval);
          }
        } catch (error) {
          console.error('Error fetching job status:', error);
          clearInterval(statusInterval);
        }
      }, 2000); // Check every 2 seconds
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [jobId, jobStatus?.status]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setJobId(null);
    setJobStatus(null);

    try {
      if (!file) {
        throw new Error('Please select a CSV file');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('csvFile', file);
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const response = await fetch('/api/send-emails', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send emails');
      }

      setSuccess('Email job created successfully!');
      setJobId(data.jobId);
      setJobStatus({
        status: 'pending',
        completedEmails: 0,
        failedEmails: 0,
        totalEmails: data.totalEmails,
        scheduledTime: data.scheduledTime
      });

      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatScheduledTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Send Emails</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="csvFile">CSV File</Label>
            <Input
              ref={fileInputRef}
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpUsername">SMTP Username</Label>
              <Input
                id="smtpUsername"
                name="smtpUsername"
                type="email"
                value={formData.smtpUsername}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                name="smtpPassword"
                type="password"
                value={formData.smtpPassword}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                name="senderName"
                value={formData.senderName}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="smtpServer">SMTP Server</Label>
              <Input
                id="smtpServer"
                name="smtpServer"
                value={formData.smtpServer}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                name="smtpPort"
                type="number"
                value={formData.smtpPort}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="emailDelay">Delay Between Emails (seconds)</Label>
              <Input
                id="emailDelay"
                name="emailDelay"
                type="number"
                min="1"
                max="3600"
                value={formData.emailDelay}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="scheduledTime">Schedule Time (optional)</Label>
              <Input
                id="scheduledTime"
                name="scheduledTime"
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Processing...' : 'Send Emails'}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-4 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {jobStatus && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold">Job Status</h2>
            <div className="space-y-2">
              <p>
                Status: <span className={getStatusColor(jobStatus.status)}>
                  {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                </span>
              </p>
              <p>Scheduled Time: {formatScheduledTime(jobStatus.scheduledTime)}</p>
              <p>Progress: {jobStatus.completedEmails} of {jobStatus.totalEmails} emails sent</p>
              {jobStatus.failedEmails > 0 && (
                <p className="text-red-600">Failed Emails: {jobStatus.failedEmails}</p>
              )}
              {jobStatus.error && (
                <p className="text-red-600">Error: {jobStatus.error}</p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
