/**
 * Donor Registration Component
 * 
 * Comprehensive multi-step form for donor registration
 * Supports both living and deceased donor workflows with conditional rendering
 */

import React, { useState } from 'react';
import {
  registerLivingDonor,
  registerDeceasedDonor,
  BLOOD_TYPES,
  LIVING_DONOR_ORGANS,
  DECEASED_DONOR_ORGANS,
  GENDER_OPTIONS,
  getDonorRegistrationStatus
} from '../../services/donorRegistrationService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';

const DonorRegistration = ({ userId, accessToken }) => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  
  const [currentStep, setCurrentStep] = useState(1);
  const [donorType, setDonorType] = useState(''); // 'living' or 'deceased'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Living Donor Form State
  const [livingDonorData, setLivingDonorData] = useState({
    organs: [],
    bloodType: '',
    age: '',
    gender: '',
    allergies: '',
    medicalConditions: '',
    medicalHistory: '',
    hasRecentTests: false,
    recentTestsDescription: '',
    consent: false
  });

  // Deceased Donor Form State
  const [deceasedDonorData, setDeceasedDonorData] = useState({
    organs: [],
    bloodType: '',
    allergies: '',
    medicalConditions: '',
    emergencyContact: {
      fullName: '',
      relationship: '',
      phone: '',
      email: '',
      address: ''
    },
    consent: false
  });

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleDonorTypeSelect = (type) => {
    setDonorType(type);
    setCurrentStep(2);
    setError('');
    setFieldErrors({});
  };

  const handleOrganToggle = (organ) => {
    if (donorType === 'living') {
      setLivingDonorData(prev => ({
        ...prev,
        organs: prev.organs.includes(organ)
          ? prev.organs.filter(o => o !== organ)
          : [...prev.organs, organ]
      }));
    } else {
      setDeceasedDonorData(prev => ({
        ...prev,
        organs: prev.organs.includes(organ)
          ? prev.organs.filter(o => o !== organ)
          : [...prev.organs, organ]
      }));
    }
    // Clear organ error when user makes selection
    if (fieldErrors.organs) {
      setFieldErrors(prev => ({ ...prev, organs: undefined }));
    }
  };

  const handleLivingDonorChange = (field, value) => {
    setLivingDonorData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDeceasedDonorChange = (field, value) => {
    setDeceasedDonorData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleEmergencyContactChange = (field, value) => {
    setDeceasedDonorData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value }
    }));
    const errorKey = `emergencyContact${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setFieldErrors({});

    try {
      let result;
      
      if (donorType === 'living') {
        result = await registerLivingDonor(userId, livingDonorData, accessToken);
      } else {
        result = await registerDeceasedDonor(userId, deceasedDonorData, accessToken);
      }

      if (result.success) {
        setSuccess(result.message);
        setCurrentStep(3); // Move to success step
        // Reset form after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
          setError('Please fix the errors below and try again.');
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) {
        setDonorType('');
      }
    }
  };

  // =====================================================
  // RENDER: STEP 1 - DONOR TYPE SELECTION
  // =====================================================

  const renderDonorTypeSelection = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Select Donor Type</h2>
        <p className="text-sm sm:text-base text-gray-600 px-4">Choose how you wish to contribute to saving lives</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Living Donor Card */}
        <Card 
          className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
          onClick={() => handleDonorTypeSelect('living')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">❤️</span>
              Living Donor
            </CardTitle>
            <CardDescription>
              Donate while alive to directly save a life
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Donate kidney, partial liver, bone marrow, or blood</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Immediate impact on patient's life</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Comprehensive medical evaluation required</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Can withdraw consent at any time</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Deceased Donor Card */}
        <Card 
          className="cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all"
          onClick={() => handleDonorTypeSelect('deceased')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🕊️</span>
              Deceased Donor
            </CardTitle>
            <CardDescription>
              Posthumous donation to help multiple lives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">✓</span>
                <span>Donate multiple organs and tissues</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">✓</span>
                <span>Can save up to 8 lives with organs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">✓</span>
                <span>Help over 75 people with tissue donation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">✓</span>
                <span>Leave a lasting legacy of compassion</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // =====================================================
  // RENDER: STEP 2 - LIVING DONOR FORM
  // =====================================================

  const renderLivingDonorForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Living Donor Registration</h2>
        <p className="text-sm sm:text-base text-gray-600 px-4">Please provide accurate information for medical evaluation</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Organ Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Organs You're Willing to Donate *</CardTitle>
          <CardDescription>Select one or more organs (living donation only)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {LIVING_DONOR_ORGANS.map(organ => (
              <div key={organ.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`living-${organ.value}`}
                  checked={livingDonorData.organs.includes(organ.value)}
                  onCheckedChange={() => handleOrganToggle(organ.value)}
                />
                <Label 
                  htmlFor={`living-${organ.value}`}
                  className="cursor-pointer font-normal"
                >
                  {organ.label}
                </Label>
              </div>
            ))}
          </div>
          {fieldErrors.organs && (
            <p className="text-red-500 text-sm mt-2">{fieldErrors.organs}</p>
          )}
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Blood Type */}
          <div>
            <Label htmlFor="bloodType">Blood Type *</Label>
            <select
              id="bloodType"
              value={livingDonorData.bloodType}
              onChange={(e) => handleLivingDonorChange('bloodType', e.target.value)}
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select blood type</option>
              {BLOOD_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {fieldErrors.bloodType && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.bloodType}</p>
            )}
          </div>

          {/* Age and Gender Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="100"
                value={livingDonorData.age}
                onChange={(e) => handleLivingDonorChange('age', e.target.value)}
                placeholder="Enter your age"
                required
              />
              {fieldErrors.age && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.age}</p>
              )}
            </div>

            <div>
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                value={livingDonorData.gender}
                onChange={(e) => handleLivingDonorChange('gender', e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.gender && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.gender}</p>
              )}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <Label htmlFor="allergies">Known Allergies</Label>
            <Input
              id="allergies"
              value={livingDonorData.allergies}
              onChange={(e) => handleLivingDonorChange('allergies', e.target.value)}
              placeholder="e.g., Penicillin, Pollen (optional)"
            />
          </div>

          {/* Medical Conditions */}
          <div>
            <Label htmlFor="medicalConditions">Current Medical Conditions</Label>
            <textarea
              id="medicalConditions"
              value={livingDonorData.medicalConditions}
              onChange={(e) => handleLivingDonorChange('medicalConditions', e.target.value)}
              placeholder="List any current medical conditions or medications"
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          {/* Medical History */}
          <div>
            <Label htmlFor="medicalHistory">Medical History *</Label>
            <textarea
              id="medicalHistory"
              value={livingDonorData.medicalHistory}
              onChange={(e) => handleLivingDonorChange('medicalHistory', e.target.value)}
              placeholder="Provide comprehensive medical history including past surgeries, major illnesses, etc."
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              required
            />
            {fieldErrors.medicalHistory && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.medicalHistory}</p>
            )}
          </div>

          {/* Recent Medical Tests */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="hasRecentTests"
                checked={livingDonorData.hasRecentTests}
                onCheckedChange={(checked) => 
                  handleLivingDonorChange('hasRecentTests', checked)
                }
              />
              <Label htmlFor="hasRecentTests" className="cursor-pointer font-normal">
                I have recent medical tests
              </Label>
            </div>
            
            {livingDonorData.hasRecentTests && (
              <textarea
                id="recentTestsDescription"
                value={livingDonorData.recentTestsDescription}
                onChange={(e) => handleLivingDonorChange('recentTestsDescription', e.target.value)}
                placeholder="Describe recent tests (type, date, results) or provide file references"
                className="w-full mt-2 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consent */}
      <Card>
        <CardHeader>
          <CardTitle>Consent and Agreement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md text-sm space-y-2">
              <p><strong>By providing consent, you acknowledge that:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All information provided is accurate and complete</li>
                <li>You understand the medical risks involved in organ donation</li>
                <li>You will undergo comprehensive medical evaluation</li>
                <li>You can withdraw consent at any time before the procedure</li>
                <li>Your information will be used for donor-patient matching</li>
                <li>Medical professionals will contact you for further screening</li>
              </ul>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="consent"
                checked={livingDonorData.consent}
                onCheckedChange={(checked) => 
                  handleLivingDonorChange('consent', checked)
                }
                required
              />
              <Label htmlFor="consent" className="cursor-pointer font-normal">
                I hereby consent to become a living organ donor and agree to the terms above *
              </Label>
            </div>
            {fieldErrors.consent && (
              <p className="text-red-500 text-sm">{fieldErrors.consent}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-between">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Complete Registration'}
        </Button>
      </div>
    </form>
  );

  // =====================================================
  // RENDER: STEP 2 - DECEASED DONOR FORM
  // =====================================================

  const renderDeceasedDonorForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Deceased Donor Registration</h2>
        <p className="text-sm sm:text-base text-gray-600 px-4">Plan your posthumous gift of life</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Organ Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Organs for Posthumous Donation *</CardTitle>
          <CardDescription>Select all organs you consent to donate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {DECEASED_DONOR_ORGANS.map(organ => (
              <div key={organ.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`deceased-${organ.value}`}
                  checked={deceasedDonorData.organs.includes(organ.value)}
                  onCheckedChange={() => handleOrganToggle(organ.value)}
                />
                <Label 
                  htmlFor={`deceased-${organ.value}`}
                  className="cursor-pointer font-normal"
                >
                  {organ.label}
                </Label>
              </div>
            ))}
          </div>
          {fieldErrors.organs && (
            <p className="text-red-500 text-sm mt-2">{fieldErrors.organs}</p>
          )}
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Blood Type */}
          <div>
            <Label htmlFor="bloodType">Blood Type *</Label>
            <select
              id="bloodType"
              value={deceasedDonorData.bloodType}
              onChange={(e) => handleDeceasedDonorChange('bloodType', e.target.value)}
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select blood type</option>
              {BLOOD_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {fieldErrors.bloodType && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.bloodType}</p>
            )}
          </div>

          {/* Known Medical Conditions */}
          <div>
            <Label htmlFor="medicalConditions">Known Medical Conditions</Label>
            <textarea
              id="medicalConditions"
              value={deceasedDonorData.medicalConditions}
              onChange={(e) => handleDeceasedDonorChange('medicalConditions', e.target.value)}
              placeholder="List any known medical conditions or chronic illnesses"
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-purple-500 min-h-[80px]"
            />
          </div>

          {/* Allergies */}
          <div>
            <Label htmlFor="allergies">Known Allergies</Label>
            <Input
              id="allergies"
              value={deceasedDonorData.allergies}
              onChange={(e) => handleDeceasedDonorChange('allergies', e.target.value)}
              placeholder="e.g., Penicillin, Pollen (optional)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Next of Kin / Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Next of Kin / Emergency Contact *</CardTitle>
          <CardDescription>
            This person will be contacted regarding your donation wishes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contactName">Full Name *</Label>
            <Input
              id="contactName"
              value={deceasedDonorData.emergencyContact.fullName}
              onChange={(e) => handleEmergencyContactChange('fullName', e.target.value)}
              placeholder="Enter full name"
              required
            />
            {fieldErrors.emergencyContactName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContactName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="relationship">Relationship *</Label>
            <Input
              id="relationship"
              value={deceasedDonorData.emergencyContact.relationship}
              onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
              placeholder="e.g., Spouse, Child, Parent"
              required
            />
            {fieldErrors.emergencyContactRelationship && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContactRelationship}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contactPhone">Phone Number *</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={deceasedDonorData.emergencyContact.phone}
              onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
              placeholder="+1-555-123-4567"
              required
            />
            {fieldErrors.emergencyContactPhone && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContactPhone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contactEmail">Email Address</Label>
            <Input
              id="contactEmail"
              type="email"
              value={deceasedDonorData.emergencyContact.email}
              onChange={(e) => handleEmergencyContactChange('email', e.target.value)}
              placeholder="email@example.com (optional)"
            />
          </div>

          <div>
            <Label htmlFor="contactAddress">Address</Label>
            <textarea
              id="contactAddress"
              value={deceasedDonorData.emergencyContact.address}
              onChange={(e) => handleEmergencyContactChange('address', e.target.value)}
              placeholder="Full address (optional)"
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-purple-500 min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Consent */}
      <Card>
        <CardHeader>
          <CardTitle>Posthumous Donation Consent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md text-sm space-y-2">
              <p><strong>By providing consent, you acknowledge that:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All information provided is accurate and complete</li>
                <li>You consent to posthumous organ and tissue donation</li>
                <li>Your next of kin will be informed of your wishes</li>
                <li>Organs will be allocated based on medical need and compatibility</li>
                <li>Your donation can save multiple lives</li>
                <li>You can update or revoke this consent at any time while living</li>
              </ul>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="consent"
                checked={deceasedDonorData.consent}
                onCheckedChange={(checked) => 
                  handleDeceasedDonorChange('consent', checked)
                }
                required
              />
              <Label htmlFor="consent" className="cursor-pointer font-normal">
                I hereby consent to become a posthumous organ donor and agree to the terms above *
              </Label>
            </div>
            {fieldErrors.consent && (
              <p className="text-red-500 text-sm">{fieldErrors.consent}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-between">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Complete Registration'}
        </Button>
      </div>
    </form>
  );

  // =====================================================
  // RENDER: STEP 3 - SUCCESS MESSAGE
  // =====================================================

  const renderSuccess = () => (
    <div className="text-center space-y-4 sm:space-y-6 py-8 sm:py-12 px-4">
      <div className="text-5xl sm:text-6xl mb-4">✅</div>
      <h2 className="text-2xl sm:text-3xl font-bold text-green-600">Registration Complete!</h2>
      <Alert className="border-green-500 bg-green-50">
        <AlertDescription className="text-center text-lg">
          {success}
        </AlertDescription>
      </Alert>
      <p className="text-gray-600">
        Thank you for your generous commitment to saving lives.
        <br />
        You will be redirected to your dashboard shortly...
      </p>
      <div className="pt-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    </div>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Progress Indicator */}
      <div className="mb-6 sm:mb-8 overflow-x-auto">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 min-w-max px-4">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 text-sm sm:text-base
              ${currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
              1
            </div>
            <span className="ml-1 sm:ml-2 font-medium text-xs sm:text-base">Type</span>
          </div>
          
          <div className={`w-8 sm:w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          
          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 text-sm sm:text-base
              ${currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
              2
            </div>
            <span className="ml-1 sm:ml-2 font-medium text-xs sm:text-base">Details</span>
          </div>
          
          <div className={`w-8 sm:w-16 h-1 ${currentStep >= 3 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          
          <div className={`flex items-center ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 text-sm sm:text-base
              ${currentStep >= 3 ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
              3
            </div>
            <span className="ml-1 sm:ml-2 font-medium text-xs sm:text-base">Complete</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          {currentStep === 1 && renderDonorTypeSelection()}
          {currentStep === 2 && donorType === 'living' && renderLivingDonorForm()}
          {currentStep === 2 && donorType === 'deceased' && renderDeceasedDonorForm()}
          {currentStep === 3 && renderSuccess()}
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorRegistration;
