import { useState, useEffect } from 'react';
import { Shield, Users, Activity, CheckCircle, XCircle, FileText, TrendingUp } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { getSupabaseConfig } from '@/app/utils/supabase-config';

interface AdminDashboardProps {
  user: any;
  accessToken: string;
}

export function AdminDashboard({ user, accessToken }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchPendingUsers();
    fetchAuditLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/admin/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/admin/pending`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPendingUsers(data.pendingUsers || []);
      }
    } catch (err) {
      console.error('Fetch pending users error:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/admin/audit`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/admin/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ userId })
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Remove from pending list
        setPendingUsers(pendingUsers.filter(u => u.id !== userId));
        // Refresh audit logs
        fetchAuditLogs();
      } else {
        setError(data.error || 'Failed to approve user');
      }
    } catch (err) {
      console.error('Approve user error:', err);
      setError('Network error');
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'USER_SIGNUP':
        return <Badge variant="outline">Sign Up</Badge>;
      case 'USER_SIGNIN':
        return <Badge variant="secondary">Sign In</Badge>;
      case 'USER_APPROVED':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'CASE_CREATED':
        return <Badge variant="default" className="bg-blue-600">Case Created</Badge>;
      case 'CASE_UPDATED':
        return <Badge variant="default" className="bg-purple-600">Case Updated</Badge>;
      case 'CONSENT_GIVEN':
        return <Badge variant="default" className="bg-secondary">Consent Given</Badge>;
      case 'CONSENT_WITHDRAWN':
        return <Badge variant="destructive">Consent Withdrawn</Badge>;
      case 'CASE_FUNDED':
        return <Badge variant="default" className="bg-green-600">Funded</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System oversight and user management</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalCases || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All statuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Donors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.donorsWithConsent || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">With consent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.transplantedCases || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Transplants</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Patients</span>
                <Badge variant="default" className="bg-primary">{stats?.totalPatients || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Donors</span>
                <Badge variant="default" className="bg-secondary">{stats?.totalDonors || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Hospitals</span>
                <Badge variant="default" className="bg-accent">{stats?.totalHospitals || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Sponsors</span>
                <Badge variant="default" className="bg-chart-4">{stats?.totalSponsors || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Waiting</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {stats?.waitingCases || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Matched</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {stats?.matchedCases || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Funded</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats?.fundedCases || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Transplanted</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {stats?.transplantedCases || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Approvals and Audit */}
      <Tabs defaultValue="approvals">
        <TabsList>
          <TabsTrigger value="approvals">
            <Users className="w-4 h-4 mr-2" />
            Pending Approvals ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="w-4 h-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Review and approve hospital and sponsor accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{user.name}</h3>
                            <Badge variant="outline" className="capitalize">
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Registered: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Logs</CardTitle>
              <CardDescription>
                Complete audit trail of all system activities (last 100 events)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No audit logs available</p>
                  ) : (
                    auditLogs.map((log, index) => (
                      <div key={index} className="border rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          {getActionBadge(log.action)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>User ID: {log.userId?.substring(0, 8)}...</p>
                          {log.role && <p>Role: {log.role}</p>}
                          {log.caseId && <p>Case ID: {log.caseId}</p>}
                          {log.amount && <p>Amount: ${log.amount}</p>}
                          {log.donorType && <p>Donor Type: {log.donorType}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Health */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>System Status:</strong> All systems operational. 
          All actions are logged for compliance and transparency.
        </AlertDescription>
      </Alert>
    </div>
  );
}