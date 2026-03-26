import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import path from 'path';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import db from './src/db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Email & Kakao Setup ---
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your preferred service
  auth: {
    user: process.env.SMTP_USER || 'test@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

// Mock function for Kakao API (Alimtalk)
async function sendKakaoMessage(phone: string, message: string) {
  console.log(`[KAKAO MOCK] Sending to ${phone}: ${message}`);
  // In a real app, you would use axios to call your Biz Message provider's API.
  // e.g., Solapi, Aligo, Infobank
  /*
  await axios.post('https://api.solapi.com/messages/v4/send', {
    message: {
      to: phone,
      from: process.env.KAKAO_SENDER_PHONE,
      text: message,
      kakaoOptions: { pfId: 'your_pf_id', templateId: 'your_template_id' }
    }
  }, { headers: { Authorization: \`HMAC-SHA256 apiKey=...\` } });
  */
  return true;
}

async function sendEmail(to: string, subject: string, text: string) {
  console.log(`[EMAIL MOCK] Sending to ${to}: ${subject}`);
  // If SMTP is not configured, just mock it.
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'test@example.com') {
    return true;
  }
  
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
  });
  return true;
}

// --- API Routes ---

// Get all hires
app.get('/api/hires', (req, res) => {
  const hires = db.prepare('SELECT * FROM hires ORDER BY join_date ASC').all();
  res.json(hires);
});

// Add a new hire
app.post('/api/hires', (req, res) => {
  const { name, email, phone, join_date, department } = req.body;
  const stmt = db.prepare('INSERT INTO hires (name, email, phone, join_date, department) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(name, email, phone, join_date, department);
  res.json({ id: info.lastInsertRowid, success: true });
});

// Delete a hire
app.delete('/api/hires/:id', (req, res) => {
  db.prepare('DELETE FROM hires WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get templates
app.get('/api/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM templates ORDER BY days_before DESC, type ASC').all();
  res.json(templates);
});

// Update a template
app.put('/api/templates/:id', (req, res) => {
  const { subject, body } = req.body;
  db.prepare('UPDATE templates SET subject = ?, body = ? WHERE id = ?').run(subject, body, req.params.id);
  res.json({ success: true });
});

// Get logs
app.get('/api/logs', (req, res) => {
  const logs = db.prepare(`
    SELECT logs.*, hires.name as hire_name 
    FROM logs 
    JOIN hires ON logs.hire_id = hires.id 
    ORDER BY logs.sent_at DESC 
    LIMIT 100
  `).all();
  res.json(logs);
});

// Manual trigger for testing
app.post('/api/trigger', async (req, res) => {
  await processDailyNotifications();
  res.json({ success: true, message: 'Notifications processed' });
});

// --- Core Logic ---
async function processDailyNotifications() {
  console.log('Running daily notification check...');
  const today = startOfDay(new Date());
  const hires = db.prepare('SELECT * FROM hires').all() as any[];
  const templates = db.prepare('SELECT * FROM templates').all() as any[];

  for (const hire of hires) {
    const joinDate = startOfDay(parseISO(hire.join_date));
    const daysUntilJoin = differenceInDays(joinDate, today);

    if ([15, 10, 5].includes(daysUntilJoin)) {
      console.log(`Hire ${hire.name} is joining in ${daysUntilJoin} days.`);
      
      // Find templates for this day
      const dayTemplates = templates.filter(t => t.days_before === daysUntilJoin);
      
      for (const template of dayTemplates) {
        // Replace variables
        const body = template.body.replace(/{{name}}/g, hire.name).replace(/{{department}}/g, hire.department || '');
        const subject = template.subject ? template.subject.replace(/{{name}}/g, hire.name) : '';
        
        let status = 'success';
        let message = '';

        try {
          if (template.type === 'email') {
            await sendEmail(hire.email, subject, body);
            // Send copy to recruiter
            if (process.env.SMTP_USER && process.env.SMTP_USER !== 'test@example.com') {
               await sendEmail(process.env.SMTP_USER, `[발송완료] ${hire.name}님에게 D-${daysUntilJoin} 이메일 발송됨`, `다음 내용이 발송되었습니다:\n\n${body}`);
            }
          } else if (template.type === 'kakao') {
            await sendKakaoMessage(hire.phone, body);
            // Send copy to recruiter (via email for simplicity)
            if (process.env.SMTP_USER && process.env.SMTP_USER !== 'test@example.com') {
               await sendEmail(process.env.SMTP_USER, `[발송완료] ${hire.name}님에게 D-${daysUntilJoin} 카카오톡 발송됨`, `다음 내용이 발송되었습니다:\n\n${body}`);
            }
          }
        } catch (error: any) {
          status = 'error';
          message = error.message;
          console.error(`Failed to send ${template.type} to ${hire.name}:`, error);
        }

        // Log it
        db.prepare('INSERT INTO logs (hire_id, days_before, type, status, message) VALUES (?, ?, ?, ?, ?)')
          .run(hire.id, daysUntilJoin, template.type, status, message);
      }
    }
  }
}

// Schedule cron job to run every day at 09:00 AM
cron.schedule('0 9 * * *', () => {
  processDailyNotifications();
});

// --- Vite Middleware for Development ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
