import express from 'express';
import { donorController } from '../controllers/donorSponsorController.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * Donor routes
 */

// POST /donor/consent - Update donor consent
router.post('/consent', verifyAuth, donorController.updateConsent);

// GET /donor/profile - Get donor profile
router.get('/profile', verifyAuth, donorController.getProfile);

export default router;
