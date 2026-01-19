import express from 'express';
import { caseController } from '../controllers/caseController.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * Case/transplant routes
 */

// POST /cases - Create a new case (patients only)
router.post('/', verifyAuth, caseController.createCase);

// GET /cases - Get all cases (filtered by role)
router.get('/', verifyAuth, caseController.getCases);

// PUT /cases/:caseId - Update a case (hospitals/admins only)
router.put('/:caseId', verifyAuth, caseController.updateCase);

export default router;
