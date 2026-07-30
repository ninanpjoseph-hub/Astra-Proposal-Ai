import nodemailer from 'nodemailer';
import { query } from '../../lib/db';

export interface SendFollowUpResult {
  success: boolean;
  sent: string[];
  skipped: string[];
  message: string;
}

/**
 * Reusable Nodemailer transporter using system environment variables
 */
export function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_FROM_EMAIL || 'ninan@technoastra.com',
      pass: process.env.SMTP_PASSWORD || ''
    }
  });
}

/**
 * Resolves user email addresses dynamically from the MySQL `users` table
 */
export async function sendFollowUpEmail(proposalId: string, trigger: 'manual' | 'scheduled' = 'manual'): Promise<SendFollowUpResult> {
  const smtpFromEmail = process.env.SMTP_FROM_EMAIL || 'ninan@technoastra.com';
  const smtpFromName = process.env.SMTP_FROM_NAME || 'Astra Automated Delivery';

  // 1. Fetch proposal and CRM pipeline details from database
  let prop: any = null;
  try {
    const records = await query(`
      SELECT 
        p.*, 
        c.stage AS crm_stage, 
        c.deal_value AS crm_deal_value, 
        c.updated_at AS crm_updated_at
      FROM proposals p 
      LEFT JOIN crm_pipeline c ON p.id = c.proposal_id 
      WHERE p.id = ?
    `, [proposalId]);

    if (records.length > 0) {
      prop = records[0];
    }
  } catch (error: any) {
    console.warn(`Failed to fetch proposal ${proposalId} from database for email dispatch:`, error.message);
  }

  if (!prop) {
    throw new Error(`Proposal with ID '${proposalId}' not found in database.`);
  }

  // 2. Fetch all active users from database to dynamically resolve email addresses
  let allUsers: any[] = [];
  try {
    allUsers = await query('SELECT id, name, email, role, is_active FROM users');
  } catch (error: any) {
    console.warn('Failed to fetch users list from database:', error.message);
  }

  // Collect candidate user IDs
  const candidateUserIds: string[] = [];
  if (prop.assigned_user_id) candidateUserIds.push(prop.assigned_user_id);
  if (prop.prepared_by_user_id) candidateUserIds.push(prop.prepared_by_user_id);

  // Parse shared_user_ids if present
  if (prop.shared_user_ids) {
    try {
      const shared = typeof prop.shared_user_ids === 'string' ? JSON.parse(prop.shared_user_ids) : prop.shared_user_ids;
      if (Array.isArray(shared)) {
        shared.forEach((uid: string) => candidateUserIds.push(uid));
      }
    } catch (e) {
      console.warn('Failed to parse shared_user_ids JSON:', e);
    }
  }

  const recipientsMap = new Map<string, { id: string; name: string; email: string }>();
  const skippedUserIds: string[] = [];

  // Match candidate user IDs to user records
  for (const userId of candidateUserIds) {
    const matchedUser = allUsers.find(u => u.id === userId);
    if (matchedUser) {
      if (matchedUser.email && matchedUser.email.trim().length > 0 && matchedUser.is_active !== 0) {
        recipientsMap.set(matchedUser.email.trim().toLowerCase(), {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email.trim()
        });
      } else {
        console.warn(`⚠️ Warning: Assigned/Related user '${userId}' (${matchedUser.name}) has no valid email on record. Skipping email dispatch.`);
        if (!skippedUserIds.includes(userId)) {
          skippedUserIds.push(userId);
        }
      }
    } else {
      // Fallback matching by name if userId wasn't directly found
      const nameMatch = allUsers.find(u => u.name && prop.prepared_by_name && u.name.toLowerCase() === prop.prepared_by_name.toLowerCase());
      if (nameMatch && nameMatch.email && nameMatch.email.trim().length > 0) {
        recipientsMap.set(nameMatch.email.trim().toLowerCase(), {
          id: nameMatch.id,
          name: nameMatch.name,
          email: nameMatch.email.trim()
        });
      } else {
        if (!skippedUserIds.includes(userId)) {
          skippedUserIds.push(userId);
        }
      }
    }
  }

  // Fallback: If no recipients were resolved from candidate IDs, try prepared_by_name or default Ninan P Joseph
  if (recipientsMap.size === 0 && prop.prepared_by_name) {
    const creatorUser = allUsers.find(u => u.name.toLowerCase() === prop.prepared_by_name.toLowerCase());
    if (creatorUser && creatorUser.email) {
      recipientsMap.set(creatorUser.email.trim().toLowerCase(), {
        id: creatorUser.id,
        name: creatorUser.name,
        email: creatorUser.email.trim()
      });
    }
  }

  const recipients = Array.from(recipientsMap.values());

  if (recipients.length === 0) {
    return {
      success: false,
      sent: [],
      skipped: skippedUserIds,
      message: 'No recipient email addresses found for this proposal.'
    };
  }

  // 3. Email parameters
  const projectName = prop.company_name || prop.client_name || `Opportunity #${prop.id}`;
  const clientCompany = prop.company_name || prop.client_name || 'Commercial Client';
  const pipelineStage = prop.crm_stage || prop.status || 'Draft';
  const dealValue = Number(prop.crm_deal_value || prop.total_cost || 0);
  const formattedDealValue = `QAR ${dealValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const rawUpdatedAt = prop.crm_updated_at || prop.updated_at || prop.proposal_date || new Date().toISOString();
  const lastUpdateFormatted = new Date(rawUpdatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const transporter = getTransporter();
  const sentEmails: string[] = [];

  // 4. Send personalized email to each recipient
  for (const recipient of recipients) {
    const subject = `[Daily Follow-up Alert] Active Opportunity: ${projectName}`;
    const textBody = `Dear ${recipient.name},\n\n` +
      `This is your automated daily follow-up alert for the active opportunity "${projectName}" (Client: ${clientCompany}).\n\n` +
      `Project Parameters:\n` +
      `- Pipeline Status: ${pipelineStage}\n` +
      `- Estimated Deal Value: ${formattedDealValue}\n` +
      `- Last Record Update: ${lastUpdateFormatted}\n\n` +
      `Action Item Required:\n` +
      `Please engage with client decision-makers to advance deal status and maintain momentum in the pipeline.\n\n` +
      `Note: This alert repeats every 24 hours until the pipeline status is updated to Won, Lost, or Closed.`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Astra Follow-up Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0b0f17; color: #f1f5f9; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background-color: #1e293b; padding: 16px 24px; border-bottom: 1px solid #334155; }
    .terminal-dots { display: flex; gap: 6px; margin-bottom: 8px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot-red { background-color: #ef4444; }
    .dot-yellow { background-color: #f59e0b; }
    .dot-green { background-color: #10b981; }
    .title { color: #38bdf8; font-family: "Courier New", Courier, monospace; font-size: 12px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; }
    .content { padding: 28px 24px; }
    .greeting { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
    .intro { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
    .meta-box { background-color: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin-bottom: 24px; font-family: "Courier New", Courier, monospace; font-size: 13px; }
    .meta-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #0f172a; }
    .meta-item:last-child { border-bottom: none; }
    .meta-label { color: #64748b; font-size: 11px; text-transform: uppercase; }
    .meta-val { color: #e2e8f0; font-weight: bold; }
    .meta-val-highlight { color: #10b981; font-weight: bold; }
    .meta-val-badge { color: #f59e0b; background: rgba(245, 158, 11, 0.15); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: bold; }
    .action-box { background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; padding: 14px 18px; border-radius: 0 8px 8px 0; font-size: 13px; color: #e0f2fe; margin-bottom: 24px; line-height: 1.5; }
    .footer { border-top: 1px solid #1e293b; padding: 16px 24px; background-color: #090d16; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5; font-family: "Courier New", Courier, monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="terminal-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <p class="title">ASTRA AUTOMATED DELIVERY // FOLLOW-UP DISPATCH</p>
    </div>
    <div class="content">
      <div class="greeting">Dear ${recipient.name},</div>
      <p class="intro">
        This is your automated daily follow-up summary alert for the active opportunity <strong>${projectName}</strong>.
      </p>
      
      <div class="meta-box">
        <div class="meta-item">
          <span class="meta-label">OPPORTUNITY TITLE:</span>
          <span class="meta-val">${projectName}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">CLIENT / COMPANY:</span>
          <span class="meta-val">${clientCompany}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">PIPELINE STAGE:</span>
          <span class="meta-val-badge">${pipelineStage}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">ESTIMATED DEAL VALUE:</span>
          <span class="meta-val-highlight">${formattedDealValue}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">LAST RECORD UPDATE:</span>
          <span class="meta-val">${lastUpdateFormatted}</span>
        </div>
      </div>

      <div class="action-box">
        <strong>Action Required:</strong> Please perform consistent touchpoint checks with your contact person to maintain momentum and progression down the sales funnel.
      </div>
    </div>

    <div class="footer">
      This alert repeats every 24 hours until the pipeline status is updated to Won, Lost, or Closed.
      <br>© ${new Date().getFullYear()} Astra Automated Delivery System • Technoastra
    </div>
  </div>
</body>
</html>
    `;

    try {
      if (process.env.SMTP_PASSWORD) {
        await transporter.sendMail({
          from: `"${smtpFromName}" <${smtpFromEmail}>`,
          to: recipient.email,
          subject,
          text: textBody,
          html: htmlBody,
        });
        console.log(`✉️ Real SMTP Email sent successfully to: ${recipient.name} <${recipient.email}>`);
      } else {
        console.log(`ℹ️ SMTP_PASSWORD not provided in environment. Logged email dispatch for: ${recipient.name} <${recipient.email}>`);
      }
      sentEmails.push(recipient.email);
    } catch (sendError: any) {
      console.error(`❌ Failed to send email to ${recipient.email}:`, sendError.message);
      // Still record attempt or throw error if real sending failed
      if (process.env.SMTP_PASSWORD) {
        throw new Error(`SMTP Transport Failure for ${recipient.email}: ${sendError.message}`);
      } else {
        sentEmails.push(recipient.email);
      }
    }
  }

  // 5. Log activity to database
  const logDetails = `Daily follow-up dispatched for ${projectName} to ${sentEmails.length} recipients (${sentEmails.join(', ')})`;
  try {
    await query(`
      INSERT INTO activity_log (id, timestamp, user_id, user_name, user_role, action, details)
      VALUES (?, ?, NULL, 'Astra Automated Delivery', 'System', 'Automated Email Alert', ?)
    `, [
      `act_eml_${Math.random().toString(36).substring(2, 11)}`,
      new Date().toISOString(),
      logDetails
    ]);
  } catch (logError: any) {
    console.warn('Failed to insert activity log for email dispatch:', logError.message);
  }

  return {
    success: true,
    sent: sentEmails,
    skipped: skippedUserIds,
    message: `Follow-up alerts dispatched to ${sentEmails.length} recipients.`
  };
}

/**
 * Runs scheduled daily email follow-ups for all open proposals (where pipeline stage / status NOT IN ('Won', 'Lost', 'Closed'))
 */
export async function runDailyScheduledFollowUps() {
  console.log('⏰ Executing scheduled 24-hour daily email follow-up scan...');
  try {
    const openProposals = await query(`
      SELECT p.id, p.company_name, p.client_name, p.status, c.stage 
      FROM proposals p
      LEFT JOIN crm_pipeline c ON p.id = c.proposal_id
      WHERE (c.stage IS NULL OR c.stage NOT IN ('Won', 'Lost', 'Closed'))
        AND p.status NOT IN ('Won', 'Lost', 'Closed')
    `);

    console.log(`📋 Found ${openProposals.length} active opportunities requiring daily follow-up alerts.`);

    let totalSent = 0;
    const dispatchedDetails: any[] = [];

    for (const prop of openProposals) {
      try {
        const result = await sendFollowUpEmail(prop.id, 'scheduled');
        totalSent += result.sent.length;
        dispatchedDetails.push({ proposalId: prop.id, result });
      } catch (err: any) {
        console.error(`Failed scheduled email for proposal ${prop.id}:`, err.message);
      }
    }

    console.log(`✅ Daily scheduled follow-up complete: ${totalSent} emails dispatched across ${openProposals.length} active deals.`);
    return {
      success: true,
      openDealsCount: openProposals.length,
      totalSent,
      dispatchedDetails
    };
  } catch (error: any) {
    console.error('❌ Daily scheduled follow-up job failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
