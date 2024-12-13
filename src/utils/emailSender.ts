import nodemailer from 'nodemailer';
import csv from 'csv-parser';
import fs from 'fs';

interface EmailConfig {
  smtpUsername: string;
  smtpPassword: string;
  senderName: string;
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
      .pipe(csv({
        strict: false,
        mapHeaders: ({ header }) => {
          const h = header.toLowerCase().trim();
          if (h === 'first name' || h === 'firstname' || h === 'first_name') return 'firstName';
          if (h === 'email' || h === 'email address' || h === 'emailaddress') return 'email';
          if (h === 'subject' || h === 'email subject') return 'subject';
          if (h === 'body' || h === 'email body' || h === 'message') return 'body';
          return h;
        }
      }))
      .on('data', (data: any) => {
        // Log the raw data for debugging
        console.log('Raw CSV row:', data);
        
        // Validate required fields
        if (!data.email || !data.firstName || !data.subject || !data.body) {
          console.error('Missing required fields in CSV row:', data);
          failedCount++;
          return;
        }

        results.push({
          email: data.email.trim(),
          firstName: data.firstName.trim(),
          subject: data.subject.trim(),
          body: data.body.trim()
        });
      })
      .on('end', async () => {
        console.log(`Parsed ${results.length} valid rows from CSV`);
        
        for (const row of results) {
          try {
            console.log(`Attempting to send email to ${row.email}`);
            await transporter.sendMail({
              from: `${emailConfig.senderName} <${emailConfig.smtpUsername}>`,
              to: row.email,
              subject: row.subject,
              html: `<div><p>Hi ${row.firstName},</p>${row.body}</p></div>`
            });
            console.log(`Successfully sent email to ${row.email}`);
            successCount++;
            
            // Add shorter delay between emails (5-10 seconds)
            await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 5000));
          } catch (error) {
            console.error(`Failed to send email to ${row.email}:`, error);
            failedCount++;
          }
        }

        resolve({ success: successCount, failed: failedCount });
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}