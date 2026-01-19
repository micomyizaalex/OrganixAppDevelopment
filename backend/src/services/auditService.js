import { supabase } from '../config/database.js';

/**
 * Service layer for audit logging
 */
export const auditService = {
  /**
   * Log an audit event
   */
  async logEvent(userId, action, metadata = {}) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        role: metadata.role,
        case_id: metadata.caseId,
        target_user_id: metadata.targetUserId,
        amount: metadata.amount,
        donor_type: metadata.donorType,
        metadata: metadata.extra
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  /**
   * Get audit logs (admin only)
   */
  async getAuditLogs(limit = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(name, email, role)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error('Failed to fetch audit logs');
    }

    return data;
  }
};
