import { Router } from 'express';
import { sendFollowUpEmail, runDailyScheduledFollowUps } from '../services/emailService';

const router = Router();

/**
 * POST /api/email/send-followup
 * Dispatches a personalized SMTP follow-up alert for a specific proposal ID
 */
router.post('/send-followup', async (req, res) => {
  const proposalId = req.body.proposal_id || req.body.proposalId;
  const trigger = req.body.trigger || 'manual';

  if (!proposalId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: proposal_id'
    });
  }

  try {
    const result = await sendFollowUpEmail(proposalId, trigger);
    return res.json(result);
  } catch (error: any) {
    console.error(`❌ Error in /api/email/send-followup for '${proposalId}':`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while sending email'
    });
  }
});

/**
 * POST /api/email/trigger-daily-run
 * Manual trigger for batch 24-hour daily automated follow-ups across all active deals
 */
router.post('/trigger-daily-run', async (req, res) => {
  try {
    const result = await runDailyScheduledFollowUps();
    return res.json(result);
  } catch (error: any) {
    console.error('❌ Error in /api/email/trigger-daily-run:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error executing daily email run'
    });
  }
});

export default router;
