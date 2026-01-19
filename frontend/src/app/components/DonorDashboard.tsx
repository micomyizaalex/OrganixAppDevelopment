import { useState, useEffect } from 'react';
import { Heart, Shield, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { getSupabaseConfig } from '@/app/utils/supabase-config';

interface DonorDashboardProps {
  user: any;
  accessToken: string;
}

export function DonorDashboard({ user, accessToken }: DonorDashboardProps) {
  const [donorProfile, setDonorProfile] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDonorType, setSelectedDonorType] = useState('');
  const [showConsentFlow, setShowConsentFlow] = useState(false);

  useEffect(() => {
    fetchDonorProfile();
    fetchCases();
  }, []);

  const fetchDonorProfile = async () => {
    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/donor/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDonorProfile(data.donor);
        if (data.donor.donorType) {
          setSelectedDonorType(data.donor.donorType);
        }
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/cases`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCases(data.cases || []);
      }
    } catch (err) {
      console.error('Fetch cases error:', err);
    }
  };

  const handleGiveConsent = async () => {
    if (!selectedDonorType) {
      setError('Please select a donor type');
      return;
    }

    setError('');

    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/donor/consent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            donorType: selectedDonorType,
            consentGiven: true
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDonorProfile(data.donor);
        setShowConsentFlow(false);
      } else {
        setError(data.error || 'Failed to give consent');
      }
    } catch (err) {
      console.error('Consent error:', err);
      setError('Network error');
    }
  };

  const handleWithdrawConsent = async () => {
    if (!window.confirm('Are you sure you want to withdraw your consent? This action can be reversed at any time.')) {
      return;
    }

    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/donor/consent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            donorType: donorProfile.donorType,
            consentGiven: false
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDonorProfile(data.donor);
      } else {
        setError(data.error || 'Failed to withdraw consent');
      }
    } catch (err) {
      console.error('Withdraw consent error:', err);
      setError('Network error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your voluntary contribution can save lives</p>
      </div>

      {/* Consent Status */}
      <Card className="border-2 border-secondary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {donorProfile?.consentGiven ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    Consent Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                    No Active Consent
                  </>
                )}
              </CardTitle>
              <CardDescription className="mt-2">
                {donorProfile?.consentGiven 
                  ? `You are registered as a ${donorProfile.donorType} donor`
                  : 'Provide your consent to become a voluntary organ donor'
                }
              </CardDescription>
            </div>
            {donorProfile?.consentGiven && (
              <Badge variant="default" className="bg-secondary">
                {donorProfile.donorType === 'living' ? 'Living Donor' : 'Deceased Donor'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {donorProfile?.consentGiven ? (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/10 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Your Identity is Protected</p>
                    <p className="text-xs text-muted-foreground">
                      Your personal information remains anonymous. Patients will never know your identity unless you choose otherwise.
                    </p>
                  </div>
                </div>
              </div>
              
              {donorProfile.consentDate && (
                <p className="text-sm text-muted-foreground">
                  Consent given on {new Date(donorProfile.consentDate).toLocaleDateString()}
                </p>
              )}

              {donorProfile.canWithdraw && (
                <Button variant="outline" onClick={handleWithdrawConsent}>
                  Withdraw Consent
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {!showConsentFlow ? (
                <Button onClick={() => setShowConsentFlow(true)} className="bg-secondary hover:bg-secondary/90">
                  <Heart className="w-4 h-4 mr-2" />
                  Give Consent to Donate
                </Button>
              ) : (
                <div className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Voluntary Organ Donation Consent</AlertTitle>
                    <AlertDescription>
                      By giving consent, you agree to donate organs voluntarily and ethically. 
                      You can withdraw this consent at any time.
                    </AlertDescription>
                  </Alert>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <Label>Select Donor Type</Label>
                    <RadioGroup value={selectedDonorType} onValueChange={setSelectedDonorType}>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="living" id="living" />
                        <Label htmlFor="living" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">Living Donor</p>
                            <p className="text-sm text-muted-foreground">
                              Donate organs while alive (e.g., kidney, liver lobe)
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="deceased" id="deceased" />
                        <Label htmlFor="deceased" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">Deceased Donor (Pre-consent)</p>
                            <p className="text-sm text-muted-foreground">
                              Consent to donate organs after passing
                            </p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleGiveConsent} className="bg-secondary hover:bg-secondary/90">
                      Confirm Consent
                    </Button>
                    <Button variant="outline" onClick={() => setShowConsentFlow(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patients Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cases.filter(c => c.status === 'waiting').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in need</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{cases.filter(c => c.status === 'matched').length}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lives Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{cases.filter(c => c.status === 'transplanted').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Successful transplants</p>
          </CardContent>
        </Card>
      </div>

      {/* General Case Information (No patient identity) */}
      <Card>
        <CardHeader>
          <CardTitle>Current Needs Overview</CardTitle>
          <CardDescription>
            General information about organ needs (patient identities are protected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cases.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active cases at the moment</p>
            ) : (
              <div className="grid gap-3">
                {cases.slice(0, 5).map((caseData) => (
                  <div key={caseData.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{caseData.organNeeded}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {caseData.urgencyLevel} urgency
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {caseData.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Your Anonymity is Guaranteed</AlertTitle>
          <AlertDescription>
            Your personal information, identity, and contact details are never shared with patients or their families.
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Withdraw Anytime</AlertTitle>
          <AlertDescription>
            You can withdraw your consent at any time with no questions asked. Your decision is always respected.
          </AlertDescription>
        </Alert>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Donor Matching Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">You Give Consent</p>
                <p className="text-sm text-muted-foreground">Voluntarily agree to donate as a living or deceased donor</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Hospital Reviews Match</p>
                <p className="text-sm text-muted-foreground">Licensed hospitals review compatibility (medical decision only)</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Identity Protected</p>
                <p className="text-sm text-muted-foreground">Your information remains anonymous throughout the process</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">Save a Life</p>
                <p className="text-sm text-muted-foreground">Your ethical donation helps someone in need</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}