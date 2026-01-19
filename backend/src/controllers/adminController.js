import { adminService } from '../services/adminService.js';
import { auditService } from '../services/auditService.js';

/**
 * Controller for admin operations
 */
export const adminController = {
  /**
   * Get users pending approval
   */
  async getPendingApprovals(req, res) {
    try {
      const pendingUsers = await adminService.getPendingApprovals();

      res.json({ success: true, pendingUsers });

    } catch (error) {
      console.error('Get pending approvals error:', error);
      res.status(500).json({ error: error.message || 'Failed to get pending approvals' });
    }
  },

  /**
   * Approve a user
   */
  async approveUser(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      const user = await adminService.approveUser(userId);

      // Log audit event
      await auditService.logEvent(req.user.id, 'USER_APPROVED', {
        targetUserId: userId,
        role: user.role
      });

      res.json({ success: true, user });

    } catch (error) {
      console.error('Approval error:', error);
      res.status(404).json({ error: error.message || 'Failed to approve user' });
    }
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(req, res) {
    try {
      const logs = await auditService.getAuditLogs();

      // Format logs to match frontend expectations
      const formattedLogs = logs.map(log => ({
        userId: log.user_id,
        action: log.action,
        role: log.role,
        caseId: log.case_id,
        amount: log.amount ? parseFloat(log.amount) : null,
        donorType: log.donor_type,
        timestamp: log.created_at
      }));

      res.json({ success: true, logs: formattedLogs });

    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: error.message || 'Failed to get audit logs' });
    }
  },

  /**
   * Get system statistics
   */
  async getSystemStats(req, res) {
    try {
      const stats = await adminService.getSystemStats();

      res.json({ success: true, stats });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: error.message || 'Failed to get stats' });
    }
  }
};
