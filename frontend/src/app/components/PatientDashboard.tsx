import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Progress } from '@/app/components/ui/progress';
import { getSupabaseConfig } from '@/app/utils/supabase-config';

interface PatientDashboardProps {
  user: any;
  accessToken: string;
}

export function PatientDashboard({ user, accessToken }: PatientDashboardProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New case form
  const [organNeeded, setOrganNeeded] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCases();
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

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/cases`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            organNeeded,
            urgencyLevel,
            notes
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCases([data.case, ...cases]);
        setIsDialogOpen(false);
        setOrganNeeded('');
        setUrgencyLevel('');
        setNotes('');
      } else {
        setError(data.error || 'Failed to create case');
      }
    } catch (err) {
      console.error('Create case error:', err);
      setError('Network error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="w-4 h-4" />;
      case 'matched':
        return <CheckCircle className="w-4 h-4" />;
      case 'funded':
        return <DollarSign className="w-4 h-4" />;
      case 'transplanted':
        return <Activity className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'matched':
        return 'bg-blue-100 text-blue-800';
      case 'funded':
        return 'bg-green-100 text-green-800';
      case 'transplanted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your cases and track your journey</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Case
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Case</DialogTitle>
              <DialogDescription>
                Register your organ transplant case. All information is confidential.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCase} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="organ">Organ Needed</Label>
                <Select value={organNeeded} onValueChange={setOrganNeeded}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organ type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kidney">Kidney</SelectItem>
                    <SelectItem value="liver">Liver</SelectItem>
                    <SelectItem value="heart">Heart</SelectItem>
                    <SelectItem value="lung">Lung</SelectItem>
                    <SelectItem value="pancreas">Pancreas</SelectItem>
                    <SelectItem value="cornea">Cornea</SelectItem>
                    <SelectItem value="bone-marrow">Bone Marrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full">
                Create Case
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {cases.filter(c => c.status === 'waiting').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {cases.filter(c => c.status === 'matched').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {cases.filter(c => c.status === 'funded').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Cases</h2>
        
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading cases...
            </CardContent>
          </Card>
        ) : cases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">You haven't created any cases yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Case
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {cases.map((caseData) => (
              <Card key={caseData.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="capitalize">{caseData.organNeeded} Transplant</CardTitle>
                        <Badge variant={getUrgencyColor(caseData.urgencyLevel)} className="capitalize">
                          {caseData.urgencyLevel}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created {new Date(caseData.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseData.status)}`}>
                      {getStatusIcon(caseData.status)}
                      <span className="capitalize">{caseData.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {caseData.notes && (
                    <p className="text-sm text-muted-foreground mb-4">{caseData.notes}</p>
                  )}
                  
                  {/* Timeline Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Case Progress</span>
                      <span>
                        {caseData.status === 'waiting' && '25%'}
                        {caseData.status === 'matched' && '50%'}
                        {caseData.status === 'funded' && '75%'}
                        {caseData.status === 'transplanted' && '100%'}
                      </span>
                    </div>
                    <Progress 
                      value={
                        caseData.status === 'waiting' ? 25 :
                        caseData.status === 'matched' ? 50 :
                        caseData.status === 'funded' ? 75 :
                        caseData.status === 'transplanted' ? 100 : 0
                      }
                    />
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <div className={`text-xs ${caseData.status === 'waiting' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        Waiting
                      </div>
                      <div className={`text-xs ${caseData.status === 'matched' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        Matched
                      </div>
                      <div className={`text-xs ${caseData.status === 'funded' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        Funded
                      </div>
                      <div className={`text-xs ${caseData.status === 'transplanted' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        Transplanted
                      </div>
                    </div>
                  </div>

                  {/* Funding Info */}
                  {caseData.fundingGoal > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">Funding Progress</span>
                        <span className="text-muted-foreground">
                          ${caseData.fundingAmount || 0} / ${caseData.fundingGoal}
                        </span>
                      </div>
                      <Progress value={(caseData.fundingAmount / caseData.fundingGoal) * 100} />
                      {caseData.sponsors && caseData.sponsors.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Supported by {caseData.sponsors.length} sponsor{caseData.sponsors.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy & Anonymity:</strong> Your donor's identity is protected by default. 
          All medical decisions are made by licensed hospitals. Organix coordinates, but does not provide medical care.
        </AlertDescription>
      </Alert>
    </div>
  );
}