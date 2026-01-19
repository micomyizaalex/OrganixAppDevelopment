import { donorService, sponsorService } from '../services/donorSponsorService.js';
import { auditService } from '../services/auditService.js';

/**
 * Controller for donor operations
 */
export const donorController = {
  /**
   * Update donor consent
   */
  async updateConsent(req, res) {
    try {
      if (req.user.role !== 'donor') {
        return res.status(403).json({ error: 'Only donors can give consent' });
      }

      const { donorType, consentGiven } = req.body;

      if (!donorType || consentGiven === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: donorType, consentGiven'
        });
      }

      const donor = await donorService.updateConsent(
        req.user.id,
        donorType,
        consentGiven
      );

      // Log audit event
      await auditService.logEvent(
        req.user.id,
        consentGiven ? 'CONSENT_GIVEN' : 'CONSENT_WITHDRAWN',
        { donorType }
      );

      res.json({ success: true, donor });

    } catch (error) {
      console.error('Consent update error:', error);
      res.status(500).json({ error: error.message || 'Failed to update consent' });
    }
  },

  /**
   * Get donor profile
   */
  async getProfile(req, res) {
    try {
      if (req.user.role !== 'donor') {
        return res.status(403).json({ error: 'Only donors can view donor profile' });
      }

      const donor = await donorService.getDonorProfile(req.user.id);

      res.json({ success: true, donor });

    } catch (error) {
      console.error('Get donor profile error:', error);
      res.status(500).json({ error: error.message || 'Failed to get donor profile' });
    }
  }
};

/**
 * Controller for sponsor operations
 */
export const sponsorController = {
  /**
   * Fund a case
   */
  async fundCase(req, res) {
    try {
      if (req.user.role !== 'sponsor') {
        return res.status(403).json({ error: 'Only sponsors can fund cases' });
      }

      // Check if sponsor is approved
      const isApproved = await sponsorService.checkApproval(req.user.id);
      if (!isApproved) {
        return res.status(403).json({ error: 'Sponsor not approved' });
      }

      const { caseId, amount } = req.body;

      if (!caseId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid caseId or amount' });
      }

      const result = await sponsorService.fundCase(req.user.id, caseId, amount);

      // Log audit event
      await auditService.logEvent(req.user.id, 'CASE_FUNDED', {
        caseId,
        amount
      });

      res.json({
        success: true,
        funding: result.funding,
        case: result.case
      });

    } catch (error) {
      console.error('Fund case error:', error);
      res.status(500).json({ error: error.message || 'Failed to fund case' });
    }
  },

  /**
   * Get sponsor statistics
   */
  async getStats(req, res) {
    try {
      if (req.user.role !== 'sponsor') {
        return res.status(403).json({ error: 'Only sponsors can view sponsor stats' });
      }

      const stats = await sponsorService.getSponsorStats(req.user.id);

      res.json({ success: true, stats });

    } catch (error) {
      console.error('Get sponsor stats error:', error);
      res.status(500).json({ error: error.message || 'Failed to get sponsor stats' });
    }
  }
};
