import mongoose from 'mongoose';

export interface IEmailJob {
  scheduledTime: Date;
  emailDelay: number;
  smtpConfig: {
    username: string;
    password: string;
    server: string;
    port: number;
    senderName: string;
  };
  csvData: {
    firstName: string;
    email: string;
    subject: string;
    body: string;
  }[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  completedEmails: number;
  failedEmails: number;
}

const EmailJobSchema = new mongoose.Schema<IEmailJob>({
  scheduledTime: { type: Date, required: true },
  emailDelay: { type: Number, required: true },
  smtpConfig: {
    username: { type: String, required: true },
    password: { type: String, required: true },
    server: { type: String, required: true },
    port: { type: Number, required: true },
    senderName: { type: String, required: true }
  },
  csvData: [{
    firstName: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  error: { type: String },
  completedEmails: { type: Number, default: 0 },
  failedEmails: { type: Number, default: 0 }
});

export const EmailJob = mongoose.models.EmailJob || mongoose.model<IEmailJob>('EmailJob', EmailJobSchema);
