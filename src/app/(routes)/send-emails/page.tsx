'use client';

import { useState } from 'react';
import axios from 'axios';

export default function SendEmails() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [status, setStatus] = useState('');

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
      setStatus('Sending emails...');
      const response = await axios.post('/api/send-emails', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStatus(`Emails sent successfully. 
        Successful: ${response.data.success}, 
        Failed: ${response.data.failed}`);
    } catch (error) {
      setStatus('Error sending emails');
      console.error(error);
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
          />
        </div>
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-2 rounded"
        >
          Send Emails
        </button>
      </form>
      {status && (
        <div className="mt-4 p-2 bg-gray-100">
          {status}
        </div>
      )}
    </div>
  );
}
