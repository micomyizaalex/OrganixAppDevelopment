import { useState, useEffect } from 'react';
import { DollarSign, Heart, TrendingUp, Users, AlertCircle, User as UserIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Progress } from '@/app/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { getSupabaseConfig } from '@/app/utils/supabase-config';
import { ProfileForm } from '@/app/components/ProfileForm';

interface SponsorDashboardProps {
  user: any;
  accessToken: string;
}

export function SponsorDashboard({ user, accessToken }: SponsorDashboardProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [fundingAmount, setFundingAmount] = useState('');

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, []);

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
      } else {
        setError(data.error || 'Failed to load cases');
      }
    } catch (err) {
      console.error('Fetch cases error:', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/sponsor/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const handleFundCase = async () => {
    if (!selectedCase || !fundingAmount || parseFloat(fundingAmount) <= 0) {
      setError('Please enter a valid funding amount');
      return;
    }

    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/sponsor/fund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            caseId: selectedCase.id,
            amount: parseFloat(fundingAmount)
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setCases(cases.map(c => c.id === selectedCase.id ? data.case : c));
        setSelectedCase(null);
        setFundingAmount('');
        fetchStats(); // Refresh stats
      } else {
        setError(data.error || 'Failed to fund case');
      }
    } catch (err) {
      console.error('Fund case error:', err);
      setError('Network error');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="profile">
          <UserIcon className="w-4 h-4 mr-2" />
          My Profile
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sponsor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Fund transplant cases and track your impact</p>
        </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Funded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${stats?.totalFunded?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime contribution</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cases Supported</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.casesSupported || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Patients helped</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.approved ? (
              <Badge variant="default" className="bg-secondary text-lg px-4 py-1">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-lg px-4 py-1">
                Pending
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Cases Needing Funding</CardTitle>
          <CardDescription>
            Support verified patient cases requiring financial assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No cases available at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((caseData) => (
                <div key={caseData.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold capitalize">{caseData.organNeeded} Transplant</h3>
                        <Badge variant={getUrgencyColor(caseData.urgencyLevel)} className="capitalize">
                          {caseData.urgencyLevel}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Patient: {caseData.patientName}</p>
                        <p>Status: <span className="capitalize">{caseData.status}</span></p>
                        <p>Created: {new Date(caseData.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Funding Progress */}
                  {caseData.fundingGoal > 0 && (
                    <div className="mb-3 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">Funding Progress</span>
                        <span className="text-muted-foreground">
                          ${caseData.fundingAmount || 0} / ${caseData.fundingGoal}
                        </span>
                      </div>
                      <Progress value={(caseData.fundingAmount / caseData.fundingGoal) * 100} />
                      {caseData.sponsors && caseData.sponsors.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{caseData.sponsors.length} sponsor{caseData.sponsors.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setSelectedCase(caseData)}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Fund This Case
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Fund Transplant Case</DialogTitle>
                        <DialogDescription>
                          Provide financial support for this patient's transplant
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1 capitalize">
                            {selectedCase?.organNeeded} Transplant
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Patient: {selectedCase?.patientName}
                          </p>
                          {selectedCase?.fundingGoal > 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Goal: ${selectedCase?.fundingGoal?.toLocaleString()} 
                              {selectedCase?.fundingAmount > 0 && (
                                <span> (${selectedCase?.fundingAmount?.toLocaleString()} raised)</span>
                              )}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amount">Funding Amount (USD)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="amount"
                              type="number"
                              placeholder="0.00"
                              className="pl-10"
                              value={fundingAmount}
                              onChange={(e) => setFundingAmount(e.target.value)}
                              min="1"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <Button onClick={handleFundCase} className="w-full">
                          Confirm Funding
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your Impact</CardTitle>
          <CardDescription>How your contributions are making a difference</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900">Lives Impacted</p>
                <p className="text-sm text-green-700">
                  Your funding has supported {stats?.casesSupported || 0} patient{stats?.casesSupported !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Total Contribution</p>
                <p className="text-sm text-blue-700">
                  ${stats?.totalFunded?.toLocaleString() || 0} invested in saving lives
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sponsor Guidelines */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> You can fund full or partial amounts for any verified case. 
          All transactions are logged for transparency. Donor identities are never disclosed to sponsors.
        </AlertDescription>
      </Alert>
      </TabsContent>

      <TabsContent value="profile">
        <ProfileForm userId={user.id} userRole={user.role} accessToken={accessToken} />
      </TabsContent>
    </Tabs>
  );
}