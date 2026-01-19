import { useState, useEffect } from 'react';
import { Building2, Users, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { getSupabaseConfig } from '@/app/utils/supabase-config';

interface HospitalDashboardProps {
  user: any;
  accessToken: string;
}

export function HospitalDashboard({ user, accessToken }: HospitalDashboardProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');

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

  const handleUpdateCase = async () => {
    if (!selectedCase || !newStatus) return;

    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/cases/${selectedCase.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            status: newStatus,
            assignedHospitalId: user.id
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setCases(cases.map(c => c.id === selectedCase.id ? data.case : c));
        setSelectedCase(null);
        setNewStatus('');
      } else {
        setError(data.error || 'Failed to update case');
      }
    } catch (err) {
      console.error('Update case error:', err);
      setError('Network error');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hospital Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage patient cases and make medical decisions</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Awaiting Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {cases.filter(c => c.status === 'waiting' && !c.assignedHospitalId).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {cases.filter(c => c.status === 'matched' || c.status === 'funded').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {cases.filter(c => c.status === 'transplanted').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Medical Authority:</strong> As a licensed hospital, you have full authority to make all medical decisions. 
          Organix is a coordination platform only.
        </AlertDescription>
      </Alert>

      {/* Cases List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Cases</CardTitle>
          <CardDescription>Review and manage transplant cases</CardDescription>
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
                        <Badge variant="outline" className="capitalize">{caseData.urgencyLevel}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Patient: {caseData.patientName}</p>
                        <p>Case ID: {caseData.id.split(':')[1]}</p>
                        <p>Created: {new Date(caseData.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseData.status)}`}>
                      {caseData.status}
                    </div>
                  </div>

                  {caseData.notes && (
                    <div className="mb-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground">{caseData.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCase(caseData);
                            setNewStatus(caseData.status);
                          }}
                        >
                          Update Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Case Status</DialogTitle>
                          <DialogDescription>
                            Update the medical status of this transplant case
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Case: {selectedCase?.organNeeded} Transplant</p>
                            <p className="text-sm text-muted-foreground">Patient: {selectedCase?.patientName}</p>
                          </div>

                          <div className="space-y-2">
                            <Label>New Status</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="waiting">Waiting</SelectItem>
                                <SelectItem value="matched">Matched (Donor Found)</SelectItem>
                                <SelectItem value="funded">Funded (Ready for Surgery)</SelectItem>
                                <SelectItem value="transplanted">Transplanted (Completed)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button onClick={handleUpdateCase} className="w-full">
                            Confirm Update
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {caseData.assignedHospitalId === user.id && (
                      <Badge variant="default" className="bg-accent">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Assigned to You
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Decision Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p><strong>Review Compatibility:</strong> Ensure medical compatibility before marking as "Matched"</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p><strong>Verify Funding:</strong> Confirm funding is in place before marking as "Funded"</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p><strong>Post-Transplant:</strong> Update to "Transplanted" only after successful surgery</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p><strong>Ethical Standards:</strong> All decisions must comply with medical ethics and legal standards</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}