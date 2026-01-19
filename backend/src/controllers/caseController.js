import { caseService } from '../services/caseService.js';
import { auditService } from '../services/auditService.js';

/**
 * Controller for case/transplant operations
 */
export const caseController = {
  /**
   * Create a new case (patients only)
   */
  async createCase(req, res) {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ error: 'Only patients can create cases' });
      }

      const { organNeeded, urgencyLevel, notes } = req.body;

      if (!organNeeded || !urgencyLevel) {
        return res.status(400).json({
          error: 'Missing required fields: organNeeded, urgencyLevel'
        });
      }

      const newCase = await caseService.createCase(
        req.user.id,
        req.user.name,
        organNeeded,
        urgencyLevel,
        notes || ''
      );

      // Log audit event
      await auditService.logEvent(req.user.id, 'CASE_CREATED', { caseId: newCase.id });

      res.json({ success: true, case: newCase });

    } catch (error) {
      console.error('Case creation error:', error);
      res.status(500).json({ error: error.message || 'Failed to create case' });
    }
  },

  /**
   * Get all cases filtered by role
   */
  async getCases(req, res) {
    try {
      const cases = await caseService.getCasesByRole(req.user.id, req.user.role);

      // Anonymize patient names for donors and sponsors
      if (req.user.role === 'donor' || req.user.role === 'sponsor') {
        cases.forEach(c => {
          c.patientName = 'Anonymous Patient';
        });
      }

      res.json({ success: true, cases });

    } catch (error) {
      console.error('Get cases error:', error);
      res.status(403).json({ error: error.message || 'Failed to get cases' });
    }
  },

  /**
   * Update a case
   */
  async updateCase(req, res) {
    try {
      const { caseId } = req.params;
      const updates = {};

      // Parse updates based on role
      if (req.user.role === 'hospital') {
        if (req.body.assignedHospitalId !== undefined) {
          updates.assigned_hospital_id = req.body.assignedHospitalId;
        }
        if (req.body.matchedDonorId !== undefined) {
          updates.matched_donor_id = req.body.matchedDonorId;
          updates.status = 'matched';
        }
        if (req.body.status !== undefined) {
          updates.status = req.body.status;
        }
      } else if (req.user.role === 'admin') {
        // Admin can update any field
        if (req.body.status) updates.status = req.body.status;
        if (req.body.assignedHospitalId !== undefined) {
          updates.assigned_hospital_id = req.body.assignedHospitalId;
        }
        if (req.body.matchedDonorId !== undefined) {
          updates.matched_donor_id = req.body.matchedDonorId;
        }
        if (req.body.fundingGoal !== undefined) {
          updates.funding_goal = req.body.fundingGoal;
        }
      } else {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const updatedCase = await caseService.updateCase(
        caseId,
        updates,
        req.user.id,
        req.user.role
      );

      // Log audit event
      await auditService.logEvent(req.user.id, 'CASE_UPDATED', { caseId });

      res.json({ success: true, case: updatedCase });

    } catch (error) {
      console.error('Update case error:', error);
      res.status(500).json({ error: error.message || 'Failed to update case' });
    }
  }
};
