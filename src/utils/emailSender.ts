// src/utils/emailSender.ts
import nodemailer from 'nodemailer';
import csv from 'csv-parser';
import fs from 'fs';

interface EmailConfig {
  smtpUsername: string;
  smtpPassword: string;
  smtpServer: string;
  smtpPort: number;
}

interface EmailData {
  firstName: string;
  email: string;
  subject: string;
  body: string;
}

export async function sendEmails(
  csvFile: string, 
  emailConfig: EmailConfig
): Promise<{ success: number; failed: number }> {
  const results: EmailData[] = [];
  let successCount = 0;
  let failedCount = 0;

  // Create a transporter using the SMTP configuration
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpServer,
    port: emailConfig.smtpPort,
    secure: true, // Use SSL
    auth: {
      user: emailConfig.smtpUsername,
      pass: emailConfig.smtpPassword
    }
  });

  // Read CSV file
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const row of results) {
          try {
            await transporter.sendMail({
              from: `Bruno Gonçalves <${emailConfig.smtpUsername}>`,
              to: row.email,
              subject: row.subject,
              html: `<div><p>Hi ${row.firstName},</p>${row.body}</p></div>`
            });
            successCount++;
            
            // Add random delay between emails
            await new Promise(resolve => setTimeout(resolve, Math.random() * 30000));
          } catch (error) {
            console.error(`Failed to send email to ${row.email}:`, error);
            failedCount++;
          }
        }

        resolve({ success: successCount, failed: failedCount });
      })
      .on('error', reject);
  });
}