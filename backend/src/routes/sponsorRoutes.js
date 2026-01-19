import express from 'express';
import { sponsorController } from '../controllers/donorSponsorController.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * Sponsor routes
 */

// POST /sponsor/fund - Fund a case
router.post('/fund', verifyAuth, sponsorController.fundCase);

// GET /sponsor/stats - Get sponsor statistics
router.get('/stats', verifyAuth, sponsorController.getStats);

export default router;
