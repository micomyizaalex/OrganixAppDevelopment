/**
 * Donor Registration Service
 * 
 * Handles all donor registration operations including:
 * - Living donor registration with organ selection
 * - Deceased donor registration with posthumous consent
 * - Medical information management
 * - Emergency contact management
 * - Data validation and sanitization
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/app/utils/supabase-config';

// Create Supabase client
const config = getSupabaseConfig();
export const supabase = createClient(config.supabaseUrl, config.anonKey);

/**
 * Get authenticated Supabase client with user session
 */
const getAuthenticatedClient = (accessToken: string): SupabaseClient => {
  return createClient(config.supabaseUrl, config.anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
};

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const LIVING_DONOR_ORGANS = [
  { value: 'kidney', label: 'Kidney' },
  { value: 'partial_liver', label: 'Partial Liver' },
  { value: 'bone_marrow', label: 'Bone Marrow' },
  { value: 'blood', label: 'Blood' }
];

export const DECEASED_DONOR_ORGANS = [
  { value: 'kidney', label: 'Kidney' },
  { value: 'liver', label: 'Liver' },
  { value: 'heart', label: 'Heart' },
  { value: 'lung', label: 'Lung' },
  { value: 'pancreas', label: 'Pancreas' },
  { value: 'intestine', label: 'Intestine' },
  { value: 'cornea', label: 'Cornea' },
  { value: 'skin', label: 'Skin' },
  { value: 'bone', label: 'Bone' },
  { value: 'heart_valves', label: 'Heart Valves' }
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

export const CONTACT_TYPES = [
  { value: 'next_of_kin', label: 'Next of Kin' },
  { value: 'emergency', label: 'Emergency Contact' },
  { value: 'legal_representative', label: 'Legal Representative' }
];

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Sanitize text input by removing HTML tags and trimming whitespace
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return { valid: false, error: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
};

/**
 * Validate phone number (basic validation)
 */
export const validatePhone = (phone) => {
  if (!phone) return { valid: false, error: 'Phone number is required' };
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    return { valid: false, error: 'Phone number must have at least 10 digits' };
  }
  return { valid: true };
};

/**
 * Validate living donor registration data
 */
export const validateLivingDonorData = (data) => {
  const errors = {};

  if (!data.organs || data.organs.length === 0) {
    errors.organs = 'Please select at least one organ to donate';
  }

  if (!data.bloodType) {
    errors.bloodType = 'Blood type is required';
  }

  if (!data.age || data.age < 18 || data.age > 100) {
    errors.age = 'Age must be between 18 and 100';
  }

  if (!data.gender) {
    errors.gender = 'Gender is required';
  }

  if (!data.medicalHistory) {
    errors.medicalHistory = 'Medical history is required';
  }

  if (!data.consent) {
    errors.consent = 'You must provide consent to donate';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate deceased donor registration data
 */
export const validateDeceasedDonorData = (data) => {
  const errors = {};

  if (!data.organs || data.organs.length === 0) {
    errors.organs = 'Please select at least one organ for posthumous donation';
  }

  if (!data.bloodType) {
    errors.bloodType = 'Blood type is required';
  }

  if (!data.emergencyContact.fullName) {
    errors.emergencyContactName = 'Next of kin name is required';
  }

  if (!data.emergencyContact.phone) {
    errors.emergencyContactPhone = 'Next of kin phone is required';
  } else {
    const phoneValidation = validatePhone(data.emergencyContact.phone);
    if (!phoneValidation.valid) {
      errors.emergencyContactPhone = phoneValidation.error;
    }
  }

  if (!data.emergencyContact.relationship) {
    errors.emergencyContactRelationship = 'Relationship is required';
  }

  if (!data.consent) {
    errors.consent = 'Consent confirmation is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// =====================================================
// DATABASE OPERATIONS
// =====================================================

/**
 * Register a living donor with complete information
 */
export const registerLivingDonor = async (userId, donorData, accessToken) => {
  try {
    // Validate data
    const validation = validateLivingDonorData(donorData);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Get authenticated client
    const authClient = getAuthenticatedClient(accessToken);

    // Sanitize inputs
    const sanitizedData = {
      ...donorData,
      medicalHistory: sanitizeText(donorData.medicalHistory),
      medicalConditions: sanitizeText(donorData.medicalConditions),
      allergies: sanitizeText(donorData.allergies),
      recentTestsDescription: sanitizeText(donorData.recentTestsDescription)
    };

    // Start transaction: Update donor record
    const { error: donorError } = await authClient
      .from('donors')
      .update({
        donor_type: 'living',
        consent_given: sanitizedData.consent,
        consent_date: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (donorError) throw donorError;

    // Insert medical info
    const { error: medicalError } = await authClient
      .from('donor_medical_info')
      .upsert({
        donor_id: userId,
        blood_type: sanitizedData.bloodType,
        age: parseInt(sanitizedData.age),
        gender: sanitizedData.gender,
        allergies: sanitizedData.allergies,
        medical_conditions: sanitizedData.medicalConditions,
        medical_history: sanitizedData.medicalHistory,
        has_recent_tests: sanitizedData.hasRecentTests || false,
        recent_tests_description: sanitizedData.recentTestsDescription
      }, {
        onConflict: 'donor_id'
      });

    if (medicalError) throw medicalError;

    // Insert organs
    const organInserts = sanitizedData.organs.map(organ => ({
      donor_id: userId,
      organ_name: organ,
      is_living_donation: true,
      status: 'available'
    }));

    // Delete existing organs first, then insert new ones
    await authClient
      .from('donor_organs')
      .delete()
      .eq('donor_id', userId);

    const { error: organsError } = await authClient
      .from('donor_organs')
      .insert(organInserts);

    if (organsError) throw organsError;

    return {
      success: true,
      message: 'Living donor registration completed successfully'
    };

  } catch (error) {
    console.error('Error registering living donor:', error);
    return {
      success: false,
      error: error.message || 'Failed to register donor. Please try again.'
    };
  }
};

/**
 * Register a deceased donor with complete information
 */
export const registerDeceasedDonor = async (userId, donorData, accessToken) => {
  try {
    // Validate data
    const validation = validateDeceasedDonorData(donorData);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Get authenticated client
    const authClient = getAuthenticatedClient(accessToken);

    // Sanitize inputs
    const sanitizedData = {
      ...donorData,
      medicalConditions: sanitizeText(donorData.medicalConditions),
      allergies: sanitizeText(donorData.allergies),
      emergencyContact: {
        fullName: sanitizeText(donorData.emergencyContact.fullName),
        relationship: sanitizeText(donorData.emergencyContact.relationship),
        phone: sanitizeText(donorData.emergencyContact.phone),
        email: donorData.emergencyContact.email ? sanitizeText(donorData.emergencyContact.email) : null,
        address: sanitizeText(donorData.emergencyContact.address)
      }
    };

    // Update donor record
    const { error: donorError } = await authClient
      .from('donors')
      .update({
        donor_type: 'deceased',
        consent_given: sanitizedData.consent,
        consent_date: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (donorError) throw donorError;

    // Insert medical info (with minimal data for deceased donors)
    const { error: medicalError } = await authClient
      .from('donor_medical_info')
      .upsert({
        donor_id: userId,
        blood_type: sanitizedData.bloodType,
        allergies: sanitizedData.allergies,
        medical_conditions: sanitizedData.medicalConditions,
        medical_history: sanitizedData.medicalConditions // Use conditions as history
      }, {
        onConflict: 'donor_id'
      });

    if (medicalError) throw medicalError;

    // Insert organs
    const organInserts = sanitizedData.organs.map(organ => ({
      donor_id: userId,
      organ_name: organ,
      is_living_donation: false,
      status: 'available'
    }));

    // Delete existing organs first, then insert new ones
    await authClient
      .from('donor_organs')
      .delete()
      .eq('donor_id', userId);

    const { error: organsError } = await authClient
      .from('donor_organs')
      .insert(organInserts);

    if (organsError) throw organsError;

    // Insert emergency contact
    const { error: contactError } = await authClient
      .from('emergency_contacts')
      .insert({
        donor_id: userId,
        contact_type: 'next_of_kin',
        full_name: sanitizedData.emergencyContact.fullName,
        relationship: sanitizedData.emergencyContact.relationship,
        phone: sanitizedData.emergencyContact.phone,
        email: sanitizedData.emergencyContact.email,
        address: sanitizedData.emergencyContact.address,
        is_primary: true
      });

    if (contactError) throw contactError;

    return {
      success: true,
      message: 'Deceased donor registration completed successfully'
    };

  } catch (error) {
    console.error('Error registering deceased donor:', error);
    return {
      success: false,
      error: error.message || 'Failed to register donor. Please try again.'
    };
  }
};

/**
 * Get donor registration status
 */
export const getDonorRegistrationStatus = async (userId, accessToken) => {
  try {
    const authClient = getAuthenticatedClient(accessToken);

    const { data: donor, error: donorError } = await authClient
      .from('donors')
      .select('donor_type, consent_given')
      .eq('user_id', userId)
      .single();

    if (donorError) throw donorError;

    const { data: medicalInfo, error: medicalError } = await authClient
      .from('donor_medical_info')
      .select('*')
      .eq('donor_id', userId)
      .maybeSingle();

    const { data: organs, error: organsError } = await authClient
      .from('donor_organs')
      .select('organ_name')
      .eq('donor_id', userId);

    return {
      success: true,
      data: {
        isRegistered: donor && donor.consent_given && medicalInfo && organs && organs.length > 0,
        donorType: donor?.donor_type,
        hasConsent: donor?.consent_given,
        hasMedicalInfo: !!medicalInfo,
        organCount: organs?.length || 0
      }
    };

  } catch (error) {
    console.error('Error getting donor status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get complete donor profile
 */
export const getDonorProfile = async (userId, accessToken) => {
  try {
    const authClient = getAuthenticatedClient(accessToken);

    const { data: donor, error: donorError } = await authClient
      .from('donors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (donorError) throw donorError;

    const { data: medicalInfo } = await authClient
      .from('donor_medical_info')
      .select('*')
      .eq('donor_id', userId)
      .maybeSingle();

    const { data: organs } = await authClient
      .from('donor_organs')
      .select('*')
      .eq('donor_id', userId);

    const { data: contacts } = await authClient
      .from('emergency_contacts')
      .select('*')
      .eq('donor_id', userId);

    return {
      success: true,
      data: {
        donor,
        medicalInfo,
        organs: organs || [],
        emergencyContacts: contacts || []
      }
    };

  } catch (error) {
    console.error('Error getting donor profile:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
