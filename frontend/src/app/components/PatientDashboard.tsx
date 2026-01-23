import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, DollarSign, Activity, AlertCircle, User as UserIcon, HeartPulse, Droplet, FileText, Loader2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { getSupabaseConfig } from '@/app/utils/supabase-config';
import { ProfileForm } from '@/app/components/ProfileForm';
import { getProfile } from '@/services/profileService';
import { FileUpload } from '@/app/components/FileUpload';
import { uploadFiles, type UploadedFile } from '@/services/fileUploadService';

interface PatientDashboardProps {
  user: any;
  accessToken: string;
}

export function PatientDashboard({ user, accessToken }: PatientDashboardProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New case form - basic fields
  const [organNeeded, setOrganNeeded] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('');
  const [notes, setNotes] = useState('');
  
  // New case form - medical fields
  const [bloodType, setBloodType] = useState('');
  const [patientAge, setPatientAge] = useState<number | null>(null);
  const [chronicIllnesses, setChronicIllnesses] = useState('');
  const [additionalMedicalInfo, setAdditionalMedicalInfo] = useState('');
  
  // File uploads
  const [labResultsFiles, setLabResultsFiles] = useState<File[]>([]);
  const [medicalInfoFiles, setMedicalInfoFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchCases();
    fetchPatientAge();
  }, []);

  const fetchPatientAge = async () => {
    try {
      const profileResponse = await getProfile(user.id, 'patient');
      if (profileResponse.success && profileResponse.data?.date_of_birth) {
        const birthDate = new Date(profileResponse.data.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        setPatientAge(age);
      }
    } catch (err) {
      console.error('Failed to fetch patient age:', err);
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
    setIsUploading(true);

    // Validation
    if (!organNeeded || !urgencyLevel || !bloodType) {
      setError('Please fill in all required fields: Organ Needed, Urgency Level, and Blood Type');
      setIsUploading(false);
      return;
    }

    try {
      const config = getSupabaseConfig();
      
      // First, create the case without files
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
            notes,
            bloodType,
            patientAge,
            chronicIllnesses,
            additionalMedicalInfo
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create case');
        setIsUploading(false);
        return;
      }

      const newCaseId = data.case.id;
      const uploadedLabFiles: UploadedFile[] = [];
      const uploadedMedicalFiles: UploadedFile[] = [];

      // Upload lab results files if any
      if (labResultsFiles.length > 0) {
        const labUploadResult = await uploadFiles(
          labResultsFiles,
          user.id,
          newCaseId,
          'lab-results'
        );

        if (!labUploadResult.success) {
          setError(`Case created, but file upload failed: ${labUploadResult.errors[0]?.error}`);
          setIsUploading(false);
          setCases([data.case, ...cases]);
          return;
        }

        uploadedLabFiles.push(...labUploadResult.uploadedFiles);
      }

      // Upload medical info files if any
      if (medicalInfoFiles.length > 0) {
        const medicalUploadResult = await uploadFiles(
          medicalInfoFiles,
          user.id,
          newCaseId,
          'medical-info'
        );

        if (!medicalUploadResult.success) {
          setError(`Case created, but file upload failed: ${medicalUploadResult.errors[0]?.error}`);
          setIsUploading(false);
          setCases([data.case, ...cases]);
          return;
        }

        uploadedMedicalFiles.push(...medicalUploadResult.uploadedFiles);
      }

      // Update case with file URLs if files were uploaded
      if (uploadedLabFiles.length > 0 || uploadedMedicalFiles.length > 0) {
        const updateResponse = await fetch(
          `${config.apiUrl}/cases/${newCaseId}/files`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              labResultsFiles: uploadedLabFiles,
              medicalInfoFiles: uploadedMedicalFiles
            })
          }
        );

        if (!updateResponse.ok) {
          console.error('Failed to update case with file URLs');
        }
      }

      // Success - reset form and update cases list
      setCases([data.case, ...cases]);
      setIsDialogOpen(false);
      setOrganNeeded('');
      setUrgencyLevel('');
      setNotes('');
      setBloodType('');
      setChronicIllnesses('');
      setAdditionalMedicalInfo('');
      setLabResultsFiles([]);
      setMedicalInfoFiles([]);

    } catch (err) {
      console.error('Create case error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#0077B6] to-[#0095D9] bg-clip-text text-transparent">
                  Create New Case
                </DialogTitle>
                <DialogDescription>
                  Register your organ transplant case. All information is confidential and will help us find the best match.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCase} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Basic Information Section */}
                <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-[#0077B6]">
                  <div className="flex items-center gap-2 mb-3">
                    <HeartPulse className="w-5 h-5 text-[#0077B6]" />
                    <h3 className="font-semibold text-lg text-[#0077B6]">Basic Information</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organ" className="text-sm font-medium">
                      Organ Needed <span className="text-red-500">*</span>
                    </Label>
                    <Select value={organNeeded} onValueChange={setOrganNeeded} required>
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
                    <Label htmlFor="urgency" className="text-sm font-medium">
                      Urgency Level <span className="text-red-500">*</span>
                    </Label>
                    <Select value={urgencyLevel} onValueChange={setUrgencyLevel} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Critical
                          </span>
                        </SelectItem>
                        <SelectItem value="high">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            High
                          </span>
                        </SelectItem>
                        <SelectItem value="medium">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            Medium
                          </span>
                        </SelectItem>
                        <SelectItem value="low">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Low
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Medical Information Section */}
                <div className="space-y-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-[#27AE60]">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplet className="w-5 h-5 text-[#27AE60]" />
                    <h3 className="font-semibold text-lg text-[#27AE60]">Medical Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bloodType" className="text-sm font-medium">
                        Blood Type <span className="text-red-500">*</span>
                      </Label>
                      <Select value={bloodType} onValueChange={setBloodType} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm font-medium">
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="text"
                        value={patientAge !== null ? `${patientAge} years` : 'Not available'}
                        disabled
                        className="bg-gray-100"
                      />
                      {patientAge === null && (
                        <p className="text-xs text-muted-foreground">
                          Please update your date of birth in your profile
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chronicIllnesses" className="text-sm font-medium">
                      Chronic Illnesses
                    </Label>
                    <Textarea
                      id="chronicIllnesses"
                      placeholder="List any chronic conditions (e.g., diabetes, hypertension)..."
                      value={chronicIllnesses}
                      onChange={(e) => setChronicIllnesses(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <FileUpload
                    label="Latest Lab Results"
                    description="Upload your recent lab test results, blood work, imaging reports, etc."
                    value={labResultsFiles}
                    onChange={setLabResultsFiles}
                    multiple={true}
                    maxFiles={5}
                  />
                </div>

                {/* Additional Information Section */}
                <div className="space-y-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-l-4 border-[#2B2D42]">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-[#2B2D42]" />
                    <h3 className="font-semibold text-lg text-[#2B2D42]">Additional Information</h3>
                  </div>

                  <FileUpload
                    label="Other Medical Documents"
                    description="Upload any other relevant medical information (prescriptions, doctor's notes, medical history, etc.)"
                    value={medicalInfoFiles}
                    onChange={setMedicalInfoFiles}
                    multiple={true}
                    maxFiles={5}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="additionalMedicalInfo" className="text-sm font-medium">
                      Other Medical Information (Text)
                    </Label>
                    <Textarea
                      id="additionalMedicalInfo"
                      placeholder="Any other medical information that might be relevant for donor matching..."
                      value={additionalMedicalInfo}
                      onChange={(e) => setAdditionalMedicalInfo(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information or special circumstances..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">\n                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#0077B6] hover:bg-[#005F8F]"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating & Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Case
                      </>
                    )}
                  </Button>
                </div>
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
      </TabsContent>

      <TabsContent value="profile">
        <ProfileForm userId={user.id} userRole={user.role} accessToken={accessToken} />
      </TabsContent>
    </Tabs>
  );
}