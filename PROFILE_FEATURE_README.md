# Profile Management Feature - Implementation Guide

## Overview
This document describes the full-stack profile management feature that allows users of type Sponsor, Patient, or Donor to view and update their personal information.

## Feature Summary
- **Frontend**: React form with validation for profile management
- **Backend**: Supabase database with Row Level Security (RLS)
- **Security**: Authentication-based access control, input sanitization, and RLS policies

## Files Created/Modified

### Backend (Supabase)
1. **`supabase/migrations/002_add_profile_fields.sql`** - New migration file
   - Adds profile fields to `patients`, `donors`, and `sponsors` tables
   - Implements Row Level Security (RLS) policies
   - Ensures users can only view/update their own profiles

### Frontend
1. **`frontend/src/services/profileService.ts`** - New service file
   - Supabase client initialization
   - `getProfile()` - Fetches user profile data
   - `updateProfile()` - Updates profile with validation
   - Input sanitization and validation functions
   
2. **`frontend/src/app/components/ProfileForm.tsx`** - New component
   - Complete profile form with all required fields
   - Real-time validation with error messages
   - Success/error feedback to users
   - Responsive design with loading states

3. **Modified Dashboard Components**:
   - `PatientDashboard.tsx` - Added profile tab
   - `DonorDashboard.tsx` - Added profile tab
   - `SponsorDashboard.tsx` - Added profile tab

4. **`frontend/package.json`** - Updated
   - Added `@supabase/supabase-js` dependency

## Profile Fields

All user types (Patient, Donor, Sponsor) can manage the following fields:

| Field Name | Type | Validation | Required |
|------------|------|------------|----------|
| Full Name | Text | Min 2 characters | Yes |
| Date of Birth | Date | Valid date, not in future | No |
| Gender | Select | male/female/other/prefer_not_to_say | No |
| Phone | Text | Valid phone format, min 10 digits | No |
| Email | Email | Valid email format | No |
| Residential Address | Text | Free text | No |
| Emergency Contact | Text | Free text | No |
| National ID | Text | Free text | No |
| Health Insurance Number | Text | Free text | No |

## Setup Instructions

### 1. Apply Database Migration

You need to apply the migration to add profile fields to your Supabase database:

#### Option A: Using Supabase CLI (Recommended)
```bash
# Navigate to the project root
cd x:/OrganixApp

# Apply the migration
supabase db push

# Or if using local development
supabase migration up
```

#### Option B: Using Supabase Dashboard
1. Log in to your Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/002_add_profile_fields.sql`
4. Paste and execute the SQL

### 2. Verify Frontend Dependencies

The Supabase client has already been installed. Verify by checking:
```bash
cd x:/OrganixApp/frontend
npm list @supabase/supabase-js
```

If needed, reinstall:
```bash
npm install @supabase/supabase-js@2.47.10
```

### 3. Environment Variables

Ensure your `.env` or environment configuration includes:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start the Application

```bash
# Start the backend (if not already running)
cd x:/OrganixApp/backend
npm start

# In a new terminal, start the frontend
cd x:/OrganixApp/frontend
npm run dev
```

## Usage Guide

### For End Users

1. **Access Profile**:
   - Log in to your dashboard (Patient, Donor, or Sponsor)
   - Click on the "My Profile" tab

2. **Update Profile**:
   - Fill in or update your personal information
   - Required fields are marked with an asterisk (*)
   - Click "Update Profile" to save changes

3. **Validation**:
   - Email must be in valid format (e.g., user@example.com)
   - Phone must contain at least 10 digits
   - Date of birth must be in YYYY-MM-DD format
   - Full name must be at least 2 characters

### For Developers

#### Using the Profile Service

```typescript
import { getProfile, updateProfile } from '@/services/profileService';

// Fetch profile
const response = await getProfile(userId, userRole);
if (response.success) {
  console.log(response.data);
}

// Update profile
const updateResponse = await updateProfile(userId, userRole, {
  full_name: 'John Doe',
  phone: '+1-555-123-4567',
  email: 'john@example.com'
});
```

#### Profile Form Props

```typescript
interface ProfileFormProps {
  userId: string;        // UUID from Supabase Auth
  userRole: string;      // 'patient' | 'donor' | 'sponsor'
  accessToken: string;   // JWT access token
}
```

## Security Features

### 1. Row Level Security (RLS)
- Enabled on `patients`, `donors`, and `sponsors` tables
- Users can only SELECT, UPDATE their own records
- Policies enforce `auth.uid() = user_id`

### 2. Input Sanitization
- HTML/script tags are stripped from all text inputs
- Email addresses are normalized to lowercase
- Whitespace is trimmed from all fields

### 3. Validation
- **Client-side**: Immediate feedback in the form
- **Server-side**: Validated in `profileService.ts`
- **Database**: CHECK constraints on gender field

### 4. Authentication
- Uses Supabase Auth to verify logged-in user
- Access token passed to all API calls
- Users can only update their own profile

## Database Schema

### Profile Fields Added to Each Table

```sql
-- Common fields added to patients, donors, and sponsors
full_name TEXT
date_of_birth DATE
gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'))
phone TEXT
email TEXT
residential_address TEXT
emergency_contact TEXT
national_id TEXT
health_insurance_number TEXT
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### RLS Policies

```sql
-- Example for patients table (same for donors and sponsors)
CREATE POLICY "Users can view their own patient profile"
  ON public.patients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own patient profile"
  ON public.patients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Can access profile form from Patient dashboard
- [ ] Can access profile form from Donor dashboard
- [ ] Can access profile form from Sponsor dashboard
- [ ] Form loads existing profile data
- [ ] Required field validation works (Full Name)
- [ ] Email format validation works
- [ ] Phone format validation works
- [ ] Date of birth validation works
- [ ] Can successfully update profile
- [ ] Success message displays after update
- [ ] Error messages display for invalid inputs
- [ ] Cannot update another user's profile (security)
- [ ] Profile data persists after page refresh

## API Reference

### `getProfile(userId: string, role: string)`
Fetches the user's profile data.

**Parameters:**
- `userId`: User's UUID from Supabase Auth
- `role`: User's role ('patient', 'donor', 'sponsor')

**Returns:**
```typescript
{
  success: boolean;
  data?: ProfileData;
  error?: string;
}
```

### `updateProfile(userId: string, role: string, profileData: ProfileData)`
Updates the user's profile.

**Parameters:**
- `userId`: User's UUID
- `role`: User's role
- `profileData`: Object containing fields to update

**Returns:**
```typescript
{
  success: boolean;
  data?: ProfileData;
  error?: string;
}
```

## Troubleshooting

### Issue: "Failed to fetch profile data"
- **Cause**: RLS policies not applied or auth session not set
- **Solution**: Verify migration was applied and user is authenticated

### Issue: "Unauthorized: You can only update your own profile"
- **Cause**: User ID mismatch or invalid auth token
- **Solution**: Check that `userId` matches the authenticated user's ID

### Issue: "Invalid email format" or other validation errors
- **Cause**: Input doesn't meet validation requirements
- **Solution**: Check the validation rules in the error message and adjust input

### Issue: Migration fails with "column already exists"
- **Cause**: Migration was partially applied
- **Solution**: Either drop and recreate tables, or modify migration to use `ADD COLUMN IF NOT EXISTS`

## Future Enhancements

Potential improvements for this feature:

1. **Profile Picture Upload**: Add avatar/photo upload capability
2. **Audit Trail**: Log all profile changes with timestamps
3. **Email Verification**: Verify email addresses before updating
4. **Phone Verification**: SMS verification for phone numbers
5. **Address Autocomplete**: Integrate Google Places API for address input
6. **Profile Completeness Indicator**: Show percentage of completed fields
7. **Multi-language Support**: Internationalization for form labels
8. **Export Profile Data**: GDPR compliance - allow users to download their data

## Support

For issues or questions about this feature:
1. Check the troubleshooting section above
2. Review the code comments in the implementation files
3. Contact the development team

---

**Last Updated**: January 20, 2026
**Version**: 1.0.0
**Author**: InnoveraTech Development Team
