import { supabase } from '../config/database.js';

/**
 * Service layer for case/transplant operations
 */
export const caseService = {
  /**
   * Create a new case (patients only)
   */
  async createCase(
    patientId, 
    patientName, 
    organNeeded, 
    urgencyLevel, 
    notes = '',
    bloodType = null,
    patientAge = null,
    latestLabResults = '',
    chronicIllnesses = '',
    additionalMedicalInfo = ''
  ) {
    const { data: newCase, error } = await supabase
      .from('cases')
      .insert({
        patient_id: patientId,
        organ_needed: organNeeded,
        urgency_level: urgencyLevel,
        notes,
        blood_type: bloodType,
        patient_age: patientAge,
        latest_lab_results: latestLabResults,
        chronic_illnesses: chronicIllnesses,
        additional_medical_info: additionalMedicalInfo
      })
      .select()
      .single();

    if (error) {
      console.error('Case creation error:', error);
      throw new Error('Failed to create case');
    }

    return this.formatCase(newCase, patientName);
  },

  /**
   * Get cases filtered by user role
   */
  async getCasesByRole(userId, role) {
    let query = supabase.from('cases').select(`
      *,
      patient:users!cases_patient_id_fkey(name),
      sponsors:case_sponsors(sponsor_id, amount, created_at)
    `);

    // Filter based on role
    if (role === 'patient') {
      query = query.eq('patient_id', userId);
    } else if (role === 'hospital') {
      const isApproved = await this.checkApproval(userId, 'hospitals');
      if (!isApproved) {
        throw new Error('Hospital not approved');
      }
      query = query.or(`assigned_hospital_id.is.null,assigned_hospital_id.eq.${userId}`);
    } else if (role === 'sponsor') {
      const isApproved = await this.checkApproval(userId, 'sponsors');
      if (!isApproved) {
        throw new Error('Sponsor not approved');
      }
      // Sponsors can see all cases (anonymized patient data handled in controller)
    } else if (role === 'donor') {
      // Donors can see all cases (anonymized patient data handled in controller)
    }

    const { data: cases, error } = await query;

    if (error) {
      throw new Error('Failed to fetch cases');
    }

    return cases.map(c => this.formatCase(c, c.patient?.name));
  },

  /**
   * Update case
   */
  async updateCase(caseId, updates, userId, role) {
    // Verify permissions
    const { data: existingCase } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (!existingCase) {
      throw new Error('Case not found');
    }

    const { data: updatedCase, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update case');
    }

    return updatedCase;
  },

  /**
   * Check if user is approved in role-specific table
   */
  async checkApproval(userId, table) {
    const { data } = await supabase
      .from(table)
      .select('approved')
      .eq('user_id', userId)
      .single();

    return data?.approved || false;
  },

  /**
   * Get case by ID
   */
  async getCaseById(caseId) {
    const { data: caseData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error || !caseData) {
      return null;
    }

    return caseData;
  },

  /**
   * Update case files
   */
  async updateCaseFiles(caseId, labResultsFiles, medicalInfoFiles) {
    const { data: updatedCase, error } = await supabase
      .from('cases')
      .update({
        lab_results_files: labResultsFiles,
        medical_info_files: medicalInfoFiles
      })
      .eq('id', caseId)
      .select()
      .single();

    if (error) {
      console.error('Update case files error:', error);
      throw new Error('Failed to update case files');
    }

    return updatedCase;
  },

  /**
   * Format case for response
   */
  formatCase(caseData, patientName = null) {
    return {
      id: caseData.id,
      patientId: caseData.patient_id,
      patientName: patientName || 'Anonymous',
      organNeeded: caseData.organ_needed,
      urgencyLevel: caseData.urgency_level,
      notes: caseData.notes,
      status: caseData.status,
      createdAt: caseData.created_at,
      updatedAt: caseData.updated_at,
      matchedDonorId: caseData.matched_donor_id,
      assignedHospitalId: caseData.assigned_hospital_id,
      fundingAmount: parseFloat(caseData.funding_amount || 0),
      fundingGoal: parseFloat(caseData.funding_goal || 0),
      sponsors: caseData.sponsors || [],
      bloodType: caseData.blood_type,
      patientAge: caseData.patient_age,
      latestLabResults: caseData.latest_lab_results,
      chronicIllnesses: caseData.chronic_illnesses,
      additionalMedicalInfo: caseData.additional_medical_info,
      labResultsFiles: caseData.lab_results_files || [],
      medicalInfoFiles: caseData.medical_info_files || []
    };
  }
};
