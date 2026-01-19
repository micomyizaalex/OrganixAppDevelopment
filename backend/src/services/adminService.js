import { supabase } from '../config/database.js';

/**
 * Service layer for admin operations
 */
export const adminService = {
  /**
   * Get users pending approval
   */
  async getPendingApprovals() {
    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['hospital', 'sponsor'])
      .eq('approved', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get pending approvals');
    }

    return pendingUsers;
  },

  /**
   * Approve a user
   */
  async approveUser(userId) {
    // Get target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      throw new Error('User not found');
    }

    // Update user approval
    const { error: updateError } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Failed to approve user');
    }

    // Update role-specific table
    if (targetUser.role === 'hospital') {
      await supabase
        .from('hospitals')
        .update({ approved: true })
        .eq('user_id', userId);
    } else if (targetUser.role === 'sponsor') {
      await supabase
        .from('sponsors')
        .update({ approved: true })
        .eq('user_id', userId);
    }

    return { ...targetUser, approved: true };
  },

  /**
   * Get system statistics
   */
  async getSystemStats() {
    // Get user statistics
    const { data: users } = await supabase.from('users').select('role');
    
    // Get case statistics
    const { data: cases } = await supabase.from('cases').select('status');
    
    // Get donor statistics
    const { data: donors } = await supabase.from('donors').select('consent_given');

    return {
      totalUsers: users?.length || 0,
      totalPatients: users?.filter(u => u.role === 'patient').length || 0,
      totalDonors: users?.filter(u => u.role === 'donor').length || 0,
      totalHospitals: users?.filter(u => u.role === 'hospital').length || 0,
      totalSponsors: users?.filter(u => u.role === 'sponsor').length || 0,
      totalCases: cases?.length || 0,
      waitingCases: cases?.filter(c => c.status === 'waiting').length || 0,
      matchedCases: cases?.filter(c => c.status === 'matched').length || 0,
      fundedCases: cases?.filter(c => c.status === 'funded').length || 0,
      transplantedCases: cases?.filter(c => c.status === 'transplanted').length || 0,
      donorsWithConsent: donors?.filter(d => d.consent_given).length || 0
    };
  }
};
