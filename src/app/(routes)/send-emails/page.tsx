'use client';

import { useState } from 'react';
import axios from 'axios';

export default function SendEmails() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [senderName, setSenderName] = useState('');
  const [smtpServer, setSmtpServer] = useState('smtp.zoho.com');
  const [smtpPort, setSmtpPort] = useState('465');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile || !smtpUsername || !smtpPassword || !senderName || !smtpServer) {
      setStatus('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', csvFile);
    formData.append('smtpUsername', smtpUsername);
    formData.append('smtpPassword', smtpPassword);
    formData.append('senderName', senderName);
    formData.append('smtpServer', smtpServer);
    formData.append('smtpPort', smtpPort);

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
    <div className="min-h-screen bg-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-3">Bulk Email Sender</h1>
            <p className="text-lg text-slate-600">Send personalized emails using a CSV file</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">
                  Sender Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="text" 
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required 
                  disabled={isLoading}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">
                  SMTP Username (Email)
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="email" 
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required 
                  disabled={isLoading}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">
                  SMTP Password
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="password" 
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required 
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">
                  SMTP Server
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="text" 
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required 
                  disabled={isLoading}
                  placeholder="smtp.example.com"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">
                  SMTP Port
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="text" 
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required 
                  disabled={isLoading}
                  placeholder="465"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-base font-semibold text-slate-700 mb-2">
                  CSV File
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-base file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required 
                  disabled={isLoading}
                />
                <p className="mt-2 text-base text-slate-600">
                  CSV must include columns: First Name, Email, Subject, Body
                </p>
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                className={`w-full ${
                  isLoading 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white text-lg font-semibold py-4 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Emails'}
              </button>
            </div>
          </form>

          {status && (
            <div className={`p-6 rounded-lg border-2 ${
              status.includes('Error') 
                ? 'bg-red-50 text-red-900 border-red-200' 
                : 'bg-green-50 text-green-900 border-green-200'
            }`}>
              <p className="text-lg whitespace-pre-line font-medium">{status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
