import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import proposalsRouter from './src/server/routes/proposals';
import { query } from './src/lib/db';

// Load environmental variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser limit expanded to handle rich content & letters
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes - Must be registered first!
  app.use('/api/proposals', proposalsRouter);

  // Outgoing SMTP system configuration secrets
  app.get('/api/config', (req, res) => {
    res.json({
      smtpFromEmail: process.env.SMTP_FROM_EMAIL || 'ninan@technoastra.com',
      smtpFromName: process.env.SMTP_FROM_NAME || 'Astra Automated Delivery'
    });
  });

  // ----------------------------------------
  // EXTRA CRM BACKEND API ENDPOINTS
  // ----------------------------------------

  // A. List of Administrative Users from Database
  app.get('/api/users', async (req, res) => {
    try {
      const users = await query('SELECT * FROM users ORDER BY name ASC');
      res.json(users);
    } catch (error: any) {
      console.warn('Fallback to DB warning for users list:', error.message);
      res.status(500).json({ error: 'Database offline', message: error.message });
    }
  });

  // B. Save / Upsert Administrative User in database
  app.post('/api/users', async (req, res) => {
    const u = req.body;
    try {
      await query(`
        REPLACE INTO users (id, name, email, role, is_active, password)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [u.id, u.name, u.email, u.role, u.isActive ? 1 : 0, u.password || '']);
      res.json({ success: true, message: 'Administrative user stored to database successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // C. Delete User
  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true, message: 'User deleted from DB.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // D. List Activity Logs from Database
  app.get('/api/activity-logs', async (req, res) => {
    try {
      const logs = await query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 150');
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: 'Database logs lookup failed', message: error.message });
    }
  });

  // E. Store Activity Log in database
  app.post('/api/activity-logs', async (req, res) => {
    const l = req.body;
    try {
      if (l.userId) {
        const usersFound = await query('SELECT id FROM users WHERE id = ?', [l.userId]);
        if (usersFound.length === 0) {
          const uEmail = `${l.userId.toLowerCase()}@technoastra.com`;
          const emailExists = await query('SELECT id FROM users WHERE email = ?', [uEmail]);
          const finalEmail = emailExists.length > 0 
            ? `${l.userId.toLowerCase()}_${Math.random().toString(36).substring(2, 6)}@technoastra.com` 
            : uEmail;
          await query(
            'INSERT INTO users (id, name, email, role, is_active, password) VALUES (?, ?, ?, ?, ?, ?)',
            [l.userId, l.userName || 'System User', finalEmail, l.userRole || 'Admin', 1, 'astra2026']
          );
        }
      }

      await query(`
        INSERT INTO activity_log (id, timestamp, user_id, user_name, user_role, action, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        l.id || `act_${Math.random().toString(36).substring(2, 11)}`,
        l.timestamp || new Date().toISOString(),
        l.userId || null,
        l.userName || 'System',
        l.userRole || 'Viewer',
        l.action,
        l.details || ''
      ]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // F. CRM Dashboard Pipeline Analytics View
  app.get('/api/crm/pipeline', async (req, res) => {
    try {
      const stats = await query(`
        SELECT 
          stage, 
          COUNT(*) as count, 
          SUM(deal_value) as total_value,
          AVG(probability) as avg_probability 
        FROM crm_pipeline 
        GROUP BY stage
      `);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware setup for Development vs Production
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚧 Initializing Vite development middleware on Express server...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('🚀 Serving production deployment assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Astra Proposal AI backend running on port: ${PORT}`);
    console.log(`🌍 Health Check online at http://localhost:${PORT}/api/proposals/test-db`);
  });
}

startServer();
