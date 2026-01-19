import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { verifyAuth, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

/**
 * Admin routes (all require admin role)
 */

// GET /admin/pending - Get users pending approval
router.get('/pending', verifyAuth, requireAdmin, adminController.getPendingApprovals);

// POST /admin/approve - Approve a user
router.post('/approve', verifyAuth, requireAdmin, adminController.approveUser);

// GET /admin/audit - Get audit logs
router.get('/audit', verifyAuth, requireAdmin, adminController.getAuditLogs);

// GET /admin/stats - Get system statistics
router.get('/stats', verifyAuth, requireAdmin, adminController.getSystemStats);

export default router;
