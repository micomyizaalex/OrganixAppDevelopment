import { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Shield, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { getProfile, updateProfile, ProfileData, setAuthSession } from '../../services/profileService';

interface ProfileFormProps {
  userId: string;
  userRole: string;
  accessToken: string;
}

export function ProfileForm({ userId, userRole, accessToken }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    residential_address: '',
    emergency_contact: '',
    national_id: '',
    health_insurance_number: '',
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsFetching(true);
        
        // Set auth session for Supabase
        await setAuthSession(accessToken);

        const response = await getProfile(userId, userRole);
        
        if (response.success && response.data) {
          setFormData({
            full_name: response.data.full_name || '',
            date_of_birth: response.data.date_of_birth || '',
            gender: response.data.gender || '',
            phone: response.data.phone || '',
            email: response.data.email || '',
            residential_address: response.data.residential_address || '',
            emergency_contact: response.data.emergency_contact || '',
            national_id: response.data.national_id || '',
            health_insurance_number: response.data.health_insurance_number || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [userId, userRole, accessToken]);

  // Handle input change
  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev: ProfileData) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Full name validation
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (formData.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (!phoneRegex.test(formData.phone) || digitsOnly.length < 10) {
        errors.phone = 'Please enter a valid phone number (at least 10 digits)';
      }
    }

    // Date of birth validation
    if (formData.date_of_birth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.date_of_birth)) {
        errors.date_of_birth = 'Please use YYYY-MM-DD format';
      } else {
        const date = new Date(formData.date_of_birth);
        const today = new Date();
        if (isNaN(date.getTime())) {
          errors.date_of_birth = 'Please enter a valid date';
        } else if (date > today) {
          errors.date_of_birth = 'Date of birth cannot be in the future';
        } else {
          // Check if age is reasonable (e.g., not more than 120 years old)
          const age = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (age > 120) {
            errors.date_of_birth = 'Please enter a valid date of birth';
          }
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate form
    if (!validateForm()) {
      setError('Please correct the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      // Filter out empty fields
      const dataToUpdate: ProfileData = {};
      (Object.keys(formData) as Array<keyof ProfileData>).forEach((key) => {
        const value = formData[key];
        if (value && typeof value === 'string' && value.trim() !== '') {
          dataToUpdate[key] = value.trim();
        }
      });

      const response = await updateProfile(userId, userRole, dataToUpdate);

      if (response.success) {
        setSuccessMessage('Profile updated successfully!');
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card className="w-full max-w-5xl mx-auto shadow-healthcare border-[#E5E7EB]">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center justify-center">
            <div className="loading-spinner w-12 h-12 mb-4"></div>
            <p className="text-[#6B7280]" style={{ fontFamily: 'var(--font-body)' }}>
              Loading your profile...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-healthcare-lg border-[#E5E7EB]">
      <CardHeader className="bg-gradient-to-r from-[#0077B6] to-[#4A9FCC] text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-3 text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <User className="h-6 w-6" />
          </div>
          My Profile
        </CardTitle>
        <CardDescription className="text-white/90 mt-2" style={{ fontFamily: 'var(--font-body)' }}>
          Keep your personal information up to date for better healthcare coordination
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 bg-white">
        {/* Success Message */}
        {successMessage && (
          <div className="alert-success mb-6">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Success!</p>
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert-error mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Error</p>
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-[#0077B6]">
              <div className="w-8 h-8 bg-[#e6f4f9] rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-[#0077B6]" />
              </div>
              <h3 className="text-lg font-bold text-[#2B2D42]" style={{ fontFamily: 'var(--font-heading)' }}>
                Personal Information
              </h3>
            </div>
            
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2 text-[#2B2D42] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                <User className="h-4 w-4 text-[#0077B6]" />
                Full Name <span className="text-[#E63946]">*</span>
              </Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('full_name', e.target.value)}
                placeholder="Enter your full legal name"
                className={`border-2 ${validationErrors.full_name ? 'border-[#E63946] bg-[#fdebed]' : 'border-[#E5E7EB]'} focus:border-[#0077B6] transition-colors`}
                style={{ fontFamily: 'var(--font-body)' }}
              />
              {validationErrors.full_name && (
                <p className="text-sm text-[#E63946] flex items-center gap-1" style={{ fontFamily: 'var(--font-body)' }}>
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.full_name}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="flex items-center gap-2 text-[#2B2D42] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                <Calendar className="h-4 w-4 text-[#0077B6]" />
                Date of Birth
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('date_of_birth', e.target.value)}
                className={`border-2 ${validationErrors.date_of_birth ? 'border-[#E63946] bg-[#fdebed]' : 'border-[#E5E7EB]'} focus:border-[#0077B6] transition-colors`}
                style={{ fontFamily: 'var(--font-body)' }}
              />
              {validationErrors.date_of_birth && (
                <p className="text-sm text-[#E63946] flex items-center gap-1" style={{ fontFamily: 'var(--font-body)' }}>
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.date_of_birth}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-[#2B2D42] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value: string) => handleChange('gender', value)}
              >
                <SelectTrigger className="border-2 border-[#E5E7EB] focus:border-[#0077B6]" style={{ fontFamily: 'var(--font-body)' }}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-[#27AE60]">
              <div className="w-8 h-8 bg-[#e8f5ed] rounded-lg flex items-center justify-center">
                <Phone className="h-5 w-5 text-[#27AE60]" />
              </div>
              <h3 className="text-lg font-bold text-[#2B2D42]" style={{ fontFamily: 'var(--font-heading)' }}>
                Contact Information
              </h3>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-[#2B2D42] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                <Phone className="h-4 w-4 text-[#27AE60]" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={`border-2 ${validationErrors.phone ? 'border-[#E63946] bg-[#fdebed]' : 'border-[#E5E7EB]'} focus:border-[#27AE60] transition-colors`}
                style={{ fontFamily: 'var(--font-body)' }}
              />
              {validationErrors.phone && (
                <p className="text-sm text-[#E63946] flex items-center gap-1" style={{ fontFamily: 'var(--font-body)' }}>
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-[#2B2D42] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                <Mail className="h-4 w-4 text-[#27AE60]" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className={`border-2 ${validationErrors.email ? 'border-[#E63946] bg-[#fdebed]' : 'border-[#E5E7EB]'} focus:border-[#27AE60] transition-colors`}
                style={{ fontFamily: 'var(--font-body)' }}
              />
              {validationErrors.email && (
                <p className="text-sm text-[#E63946] flex items-center gap-1" style={{ fontFamily: 'var(--font-body)' }}>
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Residential Address */}
            <div className="space-y-2">
              <Label htmlFor="residential_address" className="flex items-center gap-2 text-[#2B2D42] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                <MapPin className="h-4 w-4 text-[#27AE60]" />
                Residential Address
              </Label>
              <Input
                id="residential_address"
                type="text"
                value={formData.residential_address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('residential_address', e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                className="border-2 border-[#E5E7EB] focus:border-[#27AE60] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            {/* Emergency Contact */}
            <div className="space-y-2">
              <Label htmlFor="emergency_contact" className="flex items-center gap-2 text-[#2B2D42] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                <Phone className="h-4 w-4 text-[#27AE60]" />
                Emergency Contact
              </Label>
              <Input
                id="emergency_contact"
                type="text"
                value={formData.emergency_contact}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('emergency_contact', e.target.value)}
                placeholder="Name and phone number"
                className="border-2 border-[#E5E7EB] focus:border-[#27AE60] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
          </div>

          {/* Identification Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-[#4A9FCC]">
              <div className="w-8 h-8 bg-[#e6f4f9] rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-[#4A9FCC]" />
              </div>
              <h3 className="text-lg font-bold text-[#2B2D42]" style={{ fontFamily: 'var(--font-heading)' }}>
                Identification & Insurance
              </h3>
            </div>

            {/* National ID */}
            <div className="space-y-2">
              <Label htmlFor="national_id" className="flex items-center gap-2 text-[#2B2D42] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                <Shield className="h-4 w-4 text-[#4A9FCC]" />
                National ID Number
              </Label>
              <Input
                id="national_id"
                type="text"
                value={formData.national_id}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('national_id', e.target.value)}
                placeholder="Enter your national ID"
                className="border-2 border-[#E5E7EB] focus:border-[#4A9FCC] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            {/* Health Insurance Number */}
            <div className="space-y-2">
              <Label htmlFor="health_insurance_number" className="flex items-center gap-2 text-[#2B2D42] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                <FileText className="h-4 w-4 text-[#4A9FCC]" />
                Health Insurance Number
              </Label>
              <Input
                id="health_insurance_number"
                type="text"
                value={formData.health_insurance_number}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('health_insurance_number', e.target.value)}
                placeholder="Enter your health insurance number"
                className="border-2 border-[#E5E7EB] focus:border-[#4A9FCC] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="alert-info">
            <Shield className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Your Privacy is Protected</p>
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                All personal information is encrypted and stored securely. Your data is only shared with authorized healthcare providers involved in your care.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-8 py-5 text-base font-semibold rounded-lg shadow-md hover:shadow-lg"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-5 h-5 border-2 mr-2"></div>
                  Updating Profile...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Update Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
