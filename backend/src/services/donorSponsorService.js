import { supabase } from '../config/database.js';

/**
 * Service layer for donor operations
 */
export const donorService = {
  /**
   * Update donor consent
   */
  async updateConsent(userId, donorType, consentGiven) {
    const { data: donor, error } = await supabase
      .from('donors')
      .update({
        donor_type: donorType,
        consent_given: consentGiven,
        consent_date: consentGiven ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update consent');
    }

    return {
      userId: donor.user_id,
      donorType: donor.donor_type,
      consentGiven: donor.consent_given,
      consentDate: donor.consent_date,
      canWithdraw: donor.can_withdraw
    };
  },

  /**
   * Get donor profile
   */
  async getDonorProfile(userId) {
    const { data: donor, error } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error('Failed to get donor profile');
    }

    return {
      userId: donor.user_id,
      donorType: donor.donor_type,
      consentGiven: donor.consent_given,
      consentDate: donor.consent_date,
      canWithdraw: donor.can_withdraw
    };
  }
};

/**
 * Service layer for sponsor operations
 */
export const sponsorService = {
  /**
   * Check if sponsor is approved
   */
  async checkApproval(userId) {
    const { data: sponsorData } = await supabase
      .from('sponsors')
      .select('approved')
      .eq('user_id', userId)
      .single();

    return sponsorData?.approved || false;
  },

  /**
   * Fund a case
   */
  async fundCase(sponsorId, caseId, amount) {
    // Check if case exists
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      throw new Error('Case not found');
    }

    // Create funding record
    const { data: funding, error: fundingError } = await supabase
      .from('case_sponsors')
      .insert({
        case_id: caseId,
        sponsor_id: sponsorId,
        amount
      })
      .select()
      .single();

    if (fundingError) {
      throw new Error('Failed to fund case');
    }

    // Get updated case data
    const { data: updatedCase } = await supabase
      .from('cases')
      .select('funding_amount, funding_goal, status')
      .eq('id', caseId)
      .single();

    return {
      funding,
      case: updatedCase
    };
  },

  /**
   * Get sponsor stats
   */
  async getSponsorStats(userId) {
    const { data: sponsor, error } = await supabase
      .from('sponsors')
      .select('total_funded, funded_count')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error('Failed to get sponsor stats');
    }

    // Get funding history
    const { data: fundingHistory } = await supabase
      .from('case_sponsors')
      .select(`
        id,
        amount,
        created_at,
        case:cases(id, organ_needed, status)
      `)
      .eq('sponsor_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      totalFunded: parseFloat(sponsor.total_funded),
      fundedCount: sponsor.funded_count,
      fundingHistory: fundingHistory || []
    };
  }
};
