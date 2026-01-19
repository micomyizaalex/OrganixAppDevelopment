import { useState } from 'react';
import { Heart, User, Mail, Lock, UserCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { getSupabaseConfig } from '@/app/utils/supabase-config';

interface AuthPageProps {
  onLogin: (user: any, accessToken: string) => void;
  onBack: () => void;
}

export function AuthPage({ onLogin, onBack }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpRole, setSignUpRole] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/auth/signin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.anonKey}`
          },
          body: JSON.stringify({
            email: signInEmail,
            password: signInPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.needsApproval) {
          setError('Your account is pending admin approval. Please wait for approval to access the platform.');
        } else {
          setError(data.error || 'Sign in failed');
        }
        setIsLoading(false);
        return;
      }

      // Login successful
      onLogin(data.user, data.accessToken);

    } catch (err) {
      console.error('Sign in error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!signUpRole) {
      setError('Please select your role');
      setIsLoading(false);
      return;
    }

    try {
      const config = getSupabaseConfig();
      const response = await fetch(
        `${config.apiUrl}/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.anonKey}`
          },
          body: JSON.stringify({
            email: signUpEmail,
            password: signUpPassword,
            name: signUpName,
            role: signUpRole
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign up failed');
        setIsLoading(false);
        return;
      }

      // Sign up successful
      setSuccessMessage(data.message);
      
      // If patient or donor, auto-login
      if (signUpRole === 'patient' || signUpRole === 'donor') {
        // Auto sign in
        setTimeout(() => {
          setSignInEmail(signUpEmail);
          setSignInPassword(signUpPassword);
        }, 1000);
      } else {
        // Clear form for hospitals and sponsors who need approval
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpName('');
        setSignUpRole('');
      }

    } catch (err) {
      console.error('Sign up error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-primary">Organix</h1>
              <p className="text-xs text-muted-foreground">by InnoveraTech</p>
            </div>
          </div>
          <p className="text-gray-600">Access the Organix platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {successMessage && (
                    <Alert className="bg-secondary/10 border-secondary text-secondary">
                      <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">I am a...</Label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select value={signUpRole} onValueChange={setSignUpRole}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patient">Patient (Needing Organ)</SelectItem>
                          <SelectItem value="donor">Donor (Voluntary)</SelectItem>
                          <SelectItem value="hospital">Hospital (Medical Provider)</SelectItem>
                          <SelectItem value="sponsor">Sponsor (NGO/Government)</SelectItem>
                          <SelectItem value="admin">Admin (InnoveraTech)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(signUpRole === 'hospital' || signUpRole === 'sponsor') && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        Your account will require admin approval before you can access the platform.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={onBack}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}