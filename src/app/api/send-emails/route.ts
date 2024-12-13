import { NextRequest, NextResponse } from 'next/server';
import { sendEmails } from '@/utils/emailSender';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(process.cwd(), 'uploads');
  form.keepExtensions = true;

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return resolve(NextResponse.json({ 
          message: 'File upload error', 
          error: err 
        }, { status: 500 }));
      }

      const csvFile = files.csvFile as formidable.File;
      const { smtpUsername, smtpPassword } = fields;

      if (!csvFile || !smtpUsername || !smtpPassword) {
        return resolve(NextResponse.json({ 
          message: 'Missing required fields' 
        }, { status: 400 }));
      }

      try {
        const result = await sendEmails(csvFile.filepath, {
          smtpUsername: smtpUsername as string,
          smtpPassword: smtpPassword as string,
          smtpServer: 'smtp.zoho.com',
          smtpPort: 465
        });

        // Clean up the uploaded file
        fs.unlinkSync(csvFile.filepath);

        resolve(NextResponse.json({
          message: 'Emails sent successfully',
          ...result
        }));
      } catch (error) {
        resolve(NextResponse.json({ 
          message: 'Error sending emails', 
          error: error instanceof Error ? error.message : error 
        }, { status: 500 }));
      }
    });
  });
}
