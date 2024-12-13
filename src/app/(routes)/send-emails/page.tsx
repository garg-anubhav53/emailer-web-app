'use client';

import { useState } from 'react';
import axios from 'axios';

export default function SendEmails() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile || !smtpUsername || !smtpPassword) {
      setStatus('Please fill in all fields');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', csvFile);
    formData.append('smtpUsername', smtpUsername);
    formData.append('smtpPassword', smtpPassword);

    try {
      setIsLoading(true);
      setStatus('Sending emails...');
      const response = await axios.post('/api/send-emails', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStatus(`Emails sent successfully. 
        Successful: ${response.data.success}, 
        Failed: ${response.data.failed}`);
    } catch (error) {
      console.error('Error:', error);
      if (axios.isAxiosError(error)) {
        setStatus(`Error sending emails: ${error.response?.data?.message || error.message}`);
      } else {
        setStatus('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Send Bulk Emails</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">SMTP Username</label>
          <input 
            type="email" 
            value={smtpUsername}
            onChange={(e) => setSmtpUsername(e.target.value)}
            className="w-full border p-2"
            required 
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block">SMTP Password</label>
          <input 
            type="password" 
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.target.value)}
            className="w-full border p-2"
            required 
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block">CSV File</label>
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="w-full border p-2"
            required 
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          className={`${
            isLoading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'
          } text-white p-2 rounded transition-colors`}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Emails'}
        </button>
      </form>
      {status && (
        <div className={`mt-4 p-2 rounded ${
          status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}
