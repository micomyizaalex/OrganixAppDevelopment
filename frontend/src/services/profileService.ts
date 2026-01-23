import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/app/utils/supabase-config';

// Create Supabase client
const config = getSupabaseConfig();
export const supabase = createClient(config.supabaseUrl, config.anonKey);

// Profile data interface
export interface ProfileData {
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  residential_address?: string;
  emergency_contact?: string;
  national_id?: string;
  health_insurance_number?: string;
}

// Response interface
export interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  error?: string;
}

/**
 * Get the profile table name based on user role
 */
function getProfileTable(role: string): string | null {
  switch (role) {
    case 'patient':
      return 'patients';
    case 'donor':
      return 'donors';
    case 'sponsor':
      return 'sponsors';
    default:
      return null;
  }
}

/**
 * Get user's profile data
 */
export async function getProfile(userId: string, role: string): Promise<ProfileResponse> {
  try {
    const tableName = getProfileTable(role);
    if (!tableName) {
      return { success: false, error: 'Invalid user role' };
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('full_name, date_of_birth, gender, phone, email, residential_address, emergency_contact, national_id, health_insurance_number')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error in getProfile:', err);
    return { success: false, error: 'Failed to fetch profile data' };
  }
}

/**
 * Update user's profile data
 * @param userId - The user's UUID
 * @param role - The user's role (patient, donor, sponsor)
 * @param profileData - Profile data to update
 */
export async function updateProfile(
  userId: string,
  role: string,
  profileData: ProfileData
): Promise<ProfileResponse> {
  try {
    // Validate input data
    if (!userId || !role) {
      return { success: false, error: 'User ID and role are required' };
    }

    const tableName = getProfileTable(role);
    if (!tableName) {
      return { success: false, error: 'Invalid user role' };
    }

    // Sanitize and validate profile data
    const sanitizedData = sanitizeProfileData(profileData);
    const validation = validateProfileData(sanitizedData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Get current user from Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized: You can only update your own profile' };
    }

    // Update the profile
    const { data, error } = await supabase
      .from(tableName)
      .update(sanitizedData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error in updateProfile:', err);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Sanitize profile data to prevent injection attacks
 */
function sanitizeProfileData(data: ProfileData): ProfileData {
  const sanitized: ProfileData = {};

  // Remove any potential HTML/script tags and trim whitespace
  if (data.full_name) {
    sanitized.full_name = data.full_name.replace(/<[^>]*>/g, '').trim();
  }
  if (data.date_of_birth) {
    sanitized.date_of_birth = data.date_of_birth;
  }
  if (data.gender) {
    sanitized.gender = data.gender;
  }
  if (data.phone) {
    sanitized.phone = data.phone.replace(/<[^>]*>/g, '').trim();
  }
  if (data.email) {
    sanitized.email = data.email.replace(/<[^>]*>/g, '').trim().toLowerCase();
  }
  if (data.residential_address) {
    sanitized.residential_address = data.residential_address.replace(/<[^>]*>/g, '').trim();
  }
  if (data.emergency_contact) {
    sanitized.emergency_contact = data.emergency_contact.replace(/<[^>]*>/g, '').trim();
  }
  if (data.national_id) {
    sanitized.national_id = data.national_id.replace(/<[^>]*>/g, '').trim();
  }
  if (data.health_insurance_number) {
    sanitized.health_insurance_number = data.health_insurance_number.replace(/<[^>]*>/g, '').trim();
  }

  return sanitized;
}

/**
 * Validate profile data
 */
function validateProfileData(data: ProfileData): { valid: boolean; error?: string } {
  // Validate email format
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: 'Invalid email format' };
    }
  }

  // Validate phone format (allow various formats)
  if (data.phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(data.phone) || data.phone.replace(/\D/g, '').length < 10) {
      return { valid: false, error: 'Invalid phone number format' };
    }
  }

  // Validate date of birth format (YYYY-MM-DD)
  if (data.date_of_birth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date_of_birth)) {
      return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
    }
    
    // Check if date is valid and not in the future
    const date = new Date(data.date_of_birth);
    if (isNaN(date.getTime()) || date > new Date()) {
      return { valid: false, error: 'Invalid date of birth' };
    }
  }

  // Validate gender
  if (data.gender) {
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
    if (!validGenders.includes(data.gender)) {
      return { valid: false, error: 'Invalid gender value' };
    }
  }

  // Validate required fields have content
  if (data.full_name && data.full_name.length < 2) {
    return { valid: false, error: 'Full name must be at least 2 characters' };
  }

  return { valid: true };
}

/**
 * Set the auth session from token
 */
export async function setAuthSession(accessToken: string) {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken, // In production, use proper refresh token
    });
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error setting auth session:', err);
    throw err;
  }
}
