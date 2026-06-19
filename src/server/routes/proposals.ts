import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { query, testConnection } from '../../lib/db';

const router = express.Router();

// Auto run check to add payment_entries column on startup and create proposal_payments table
(async () => {
  try {
    await query("ALTER TABLE proposals ADD COLUMN payment_entries JSON NULL");
    console.log("✔️ [Migration] Managed successfully: payment_entries JSON added to proposals.");
  } catch (err: any) {
    // If it already exists, this is standard and we ignore safely
  }

  try {
    // Ensure table exists with correct schema matching our query field properties
    await query(`
      CREATE TABLE IF NOT EXISTS \`proposal_payments\` (
        \`id\` VARCHAR(50) NOT NULL,
        \`proposal_id\` VARCHAR(50) NOT NULL,
        \`amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`payment_date\` DATE NOT NULL,
        \`reference\` VARCHAR(255) NULL,
        \`method\` VARCHAR(100) NOT NULL DEFAULT 'Bank Transfer',
        \`type\` VARCHAR(50) NOT NULL DEFAULT 'Custom',
        \`notes\` TEXT NULL,
        \`recorded_by\` VARCHAR(50) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_proposal_id\` (\`proposal_id\`),
        CONSTRAINT \`fk_proposal_payments_proposal\` FOREIGN KEY (\`proposal_id\`) REFERENCES \`proposals\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_proposal_payments_user\` FOREIGN KEY (\`recorded_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✔️ [Migration] Managed successfully: proposal_payments table checked/created with correct columns.");
  } catch (err: any) {
    console.error("Migration error creating proposal_payments table:", err);
  }
})();

// Lazy initialize Gemini client if key is present
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * GET /api/test-db
 * Tests connection to MySQL database
 */
router.get('/test-db', async (req, res) => {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/proposals/generate
 * Generates proposal content using Gemini 3.5 Flash
 */
router.post('/generate', async (req, res) => {
  const { clientName, companyName, briefDescription, type } = req.body;

  if (!clientName || !companyName) {
    return res.status(400).json({ error: 'Client Name and Company Name are required.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Gemini API is not configured. Please supply GEMINI_API_KEY in secrets.',
      fallback: true
    });
  }

  const isWeb = type === 'website';
  const systemInstruction = isWeb
    ? `You are an elite enterprise web proposal architect for Astra Technologies in Doha, Qatar. 
Your tone is premium, authoritative, and structured. 
Generate a comprehensive, bespoke "Executive Briefing Summary" (approx 150-250 words) and a list of 4 highly tailored operational milestones (including precise week timelines, titles, and concrete technical descriptions) fitting a custom website project.`
    : `You are an elite visual identity strategist and creative director for Astra Technologies in Doha, Qatar.
Your tone is elegant, luxurious, and highly professional.
Generate a comprehensive, bespoke "Executive Brand Briefing Summary" (approx 150-250 words) and a list of 4 highly styled visual identity milestones (including week timelines, titles, and creative methodology) fitting a premium branding project.`;

  const prompt = `Client: ${clientName}
Business Name: ${companyName}
Briefing Profile: ${briefDescription || 'No detailed brief provided.'}

Provide a JSON object containing:
{
  "executiveSummary": "Your custom generated summary detailing exactly why this project is critical, referencing Qatari excellence and standard digital/brand goals.",
  "milestones": [
    { "week": "Timeline e.g. Week 1", "title": "Bespoke Title", "description": "High-impact tactical deliverables" },
    ... exactly 4 items ...
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText.trim());
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Gemini proposal generation failed:', error);
    res.status(500).json({ error: 'Gemini AI failed to compile content: ' + error.message, fallback: true });
  }
});

/**
 * GET /api/proposals
 * List all proposals with search and optional filters
 */
router.get('/', async (req, res) => {
  const { search, status, type, userId, role } = req.query;

  try {
    let sql = 'SELECT * FROM proposals';
    const params: any[] = [];
    const conditions: string[] = [];

    // Apply role-based filters to match client-side filtering
    // Admins and Managers see everything, Sales and Designers see their assigned or prepared proposals
    if (userId && role && role !== 'Admin' && role !== 'Manager') {
      conditions.push('(prepared_by_user_id = ? OR assigned_user_id = ? OR JSON_CONTAINS(shared_user_ids, ?))');
      params.push(userId, userId, JSON.stringify(userId));
    }

    if (status && status !== 'ALL') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (type && type !== 'ALL') {
      conditions.push('type = ?');
      params.push(type);
    }

    if (search) {
      conditions.push('(client_name LIKE ? OR company_name LIKE ? OR brief_description LIKE ?)');
      const wild = `%${search}%`;
      params.push(wild, wild, wild);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY updated_at DESC';

    const records = await query(sql, params);
    res.json(records);
  } catch (error: any) {
    console.warn('Database offline, returning fallback notice:', error.message);
    res.status(500).json({ error: 'Database offline', message: error.message });
  }
});

/**
 * GET /api/proposals/:id
 * Retrieve a specific proposal
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const records = await query('SELECT * FROM proposals WHERE id = ?', [id]);
    if (records.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(records[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/proposals
 * Saves a new proposal and updates the CRM pipeline + Client registries automatically
 */
router.post('/', async (req, res) => {
  const p = req.body;

  try {
    // 1. Ensure client exists in client registry
    let clientId = p.client_id || `client_${Math.random().toString(36).substring(2, 11)}`;
    const clientsFound = await query('SELECT id FROM clients WHERE company_name = ? OR name = ?', [p.companyName, p.clientName]);
    
    if (clientsFound.length > 0) {
      clientId = clientsFound[0].id;
    } else {
      await query(
        'INSERT INTO clients (id, name, company_name, email) VALUES (?, ?, ?, ?)',
        [clientId, p.clientName, p.companyName, `${p.clientName.toLowerCase().replace(/\s+/g, '')}@astra-client.qa`]
      );
    }

    // 2. Perform replacement save inside DB
    const sql = `
      REPLACE INTO proposals (
        id, type, status, client_id, client_name, company_name, proposal_date, brief_description,
        branding_scope, website_scope, milestones, resource_costs,
        weeks, development_cost, plugin_cost, maintenance_cost, additional_cost, total_cost, payment_terms,
        prepared_by_name, prepared_by_company, prepared_by_title, prepared_by_user_id, assigned_user_id, assigned_user_name,
        shared_user_ids, custom_letterhead, letterhead_height, letterhead_mode, letterhead_full_page, show_watermark, custom_watermark_text,
        created_at, updated_at, payment_entries
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const sharedUsersJson = JSON.stringify(p.sharedUserIds || []);
    const brandingScopeJson = JSON.stringify(p.brandingScope || {});
    const websiteScopeJson = JSON.stringify(p.websiteScope || {});
    const milestonesJson = JSON.stringify(p.milestones || []);
    const resourceCostsJson = JSON.stringify(p.resourceCosts || []);
    const paymentEntriesJson = JSON.stringify(p.paymentEntries || []);

    const params = [
      p.id, p.type, p.status || 'Draft', clientId, p.clientName, p.companyName, p.proposalDate, p.briefDescription || '',
      brandingScopeJson, websiteScopeJson, milestonesJson, resourceCostsJson,
      p.weeks || 5, p.developmentCost || 0, p.pluginCost || 0, p.maintenanceCost || 0, p.additionalCost || 0, p.totalCost || 0, p.paymentTerms || '',
      p.preparedByName || '', p.preparedByCompany || '', p.preparedByTitle || '', p.preparedByUserId || null, p.assignedUserId || null, p.assignedUserName || '',
      sharedUsersJson, p.customLetterhead || null, p.letterheadHeight || 100, p.letterheadMode || 'minimal', p.letterheadFullPage ? 1 : 0, p.showWatermark ? 1 : 0, p.customWatermarkText || '',
      p.createdAt || new Date().toISOString(), p.updatedAt || new Date().toISOString(),
      paymentEntriesJson
    ];

    await query(sql, params);

    // 3. Upsert CRM Pipeline
    let pipelineStage = 'Lead';
    if (p.status === 'Won') pipelineStage = 'Won';
    else if (p.status === 'Lost') pipelineStage = 'Lost';
    else if (p.status === 'Closed') pipelineStage = 'Closed';
    else if (p.status === 'Sent' || p.status === 'Under Review') pipelineStage = 'In Negotiation';

    const probMap: Record<string, number> = { 'Draft': 20, 'Under Process': 40, 'Under Review': 60, 'Sent': 70, 'Won': 100, 'Lost': 0 };
    const probability = probMap[p.status] !== undefined ? probMap[p.status] : 50;

    await query(`
      REPLACE INTO crm_pipeline (id, proposal_id, client_id, stage, deal_value, probability, expected_close_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      `crm_${p.id}`, p.id, clientId, pipelineStage, p.totalCost || 0, probability, p.proposalDate
    ]);

    res.json({ success: true, message: 'Proposal and CRM pipeline tracked successfully in MySQL.', client_id: clientId });
  } catch (error: any) {
    console.error('Failed to save proposal in MySQL:', error);
    res.status(500).json({ error: 'Database save failed: ' + error.message });
  }
});

/**
 * PUT /api/proposals/:id
 * Updates an existing proposal status, assignments, or state details
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const p = req.body;

  try {
    const fieldsToUpdate: string[] = [];
    const params: any[] = [];

    // Support flexible dynamic updating
    if (p.status) {
      fieldsToUpdate.push('status = ?');
      params.push(p.status);
    }
    if (p.assignedUserId !== undefined) {
      fieldsToUpdate.push('assigned_user_id = ?');
      params.push(p.assignedUserId);
    }
    if (p.assignedUserName !== undefined) {
      fieldsToUpdate.push('assigned_user_name = ?');
      params.push(p.assignedUserName);
    }
    if (p.sharedUserIds) {
      fieldsToUpdate.push('shared_user_ids = ?');
      params.push(JSON.stringify(p.sharedUserIds));
    }
    if (p.briefDescription !== undefined) {
      fieldsToUpdate.push('brief_description = ?');
      params.push(p.briefDescription);
    }
    if (p.totalCost !== undefined) {
      fieldsToUpdate.push('total_cost = ?');
      params.push(p.totalCost);
    }

    fieldsToUpdate.push('updated_at = ?');
    params.push(new Date().toISOString());

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    params.push(id);
    const sql = `UPDATE proposals SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await query(sql, params);

    // Also update CRM stage if status changes
    if (p.status) {
      let pipelineStage = 'Lead';
      if (p.status === 'Won') pipelineStage = 'Won';
      else if (p.status === 'Lost') pipelineStage = 'Lost';
      else if (p.status === 'Closed') pipelineStage = 'Closed';
      else if (p.status === 'Sent' || p.status === 'Under Review') pipelineStage = 'In Negotiation';

      const probMap: Record<string, number> = { 'Draft': 20, 'Under Process': 40, 'Under Review': 60, 'Sent': 70, 'Won': 100, 'Lost': 0 };
      const probability = probMap[p.status] !== undefined ? probMap[p.status] : 50;

      await query(`
        UPDATE crm_pipeline 
        SET stage = ?, probability = ?, deal_value = IFNULL(deal_value, ?) 
        WHERE proposal_id = ?
      `, [pipelineStage, probability, p.totalCost || 0, id]);
    }

    res.json({ success: true, message: 'Proposal and CRM pipeline updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/proposals/:id
 * soft delete or complete delete (hard delete preferred to cleanup)
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM proposals WHERE id = ?', [id]);
    res.json({ success: true, message: 'Proposal deleted successfully from persistent database.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/proposals/:id/pdf
 * Logs export metadata for analytic audit
 */
router.post('/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE proposals SET pdf_export_count = pdf_export_count + 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'PDF download analytics registered.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/proposals/:proposalId/payments
 */
router.get('/:proposalId/payments', async (req, res) => {
  const { proposalId } = req.params;
  try {
    const rows = await query(
      'SELECT id, amount, payment_date AS paymentDate, reference, method, type, notes, recorded_by AS recordedBy, created_at AS createdAt FROM proposal_payments WHERE proposal_id = ? ORDER BY payment_date ASC, created_at ASC',
      [proposalId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch payments: ' + error.message });
  }
});

/**
 * POST /api/proposals/:proposalId/payments
 */
router.post('/:proposalId/payments', async (req, res) => {
  const { proposalId } = req.params;
  const { id, amount, paymentDate, reference, method, type, notes, recordedBy } = req.body;
  try {
    await query(
      `INSERT INTO proposal_payments (id, proposal_id, amount, payment_date, reference, method, type, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, proposalId, amount, paymentDate, reference, method, type, notes, recordedBy]
    );
    res.json({ success: true, message: 'Payment recorded successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record payment: ' + error.message });
  }
});

/**
 * DELETE /api/proposals/:proposalId/payments/:paymentId
 */
router.delete('/:proposalId/payments/:paymentId', async (req, res) => {
  const { proposalId, paymentId } = req.params;
  try {
    await query('DELETE FROM proposal_payments WHERE id = ? AND proposal_id = ?', [paymentId, proposalId]);
    res.json({ success: true, message: 'Payment voided successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to void payment: ' + error.message });
  }
});

export default router;
