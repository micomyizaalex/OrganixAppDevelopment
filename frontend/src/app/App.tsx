import { useState, useEffect } from 'react';
import { LandingPage } from '@/app/components/LandingPage';
import { AuthPage } from '@/app/components/AuthPage';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { PatientDashboard } from '@/app/components/PatientDashboard';
import { DonorDashboard } from '@/app/components/DonorDashboard';
import { HospitalDashboard } from '@/app/components/HospitalDashboard';
import { SponsorDashboard } from '@/app/components/SponsorDashboard';
import { AdminDashboard } from '@/app/components/AdminDashboard';

type AppView = 'landing' | 'auth' | 'dashboard';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'donor' | 'hospital' | 'sponsor' | 'admin';
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('organix_user');
    const storedToken = localStorage.getItem('organix_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
        setCurrentView('dashboard');
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('organix_user');
        localStorage.removeItem('organix_token');
      }
    }
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    setAccessToken(token);
    setCurrentView('dashboard');
    
    // Persist session
    localStorage.setItem('organix_user', JSON.stringify(userData));
    localStorage.setItem('organix_token', token);
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken('');
    setCurrentView('landing');
    
    // Clear session
    localStorage.removeItem('organix_user');
    localStorage.removeItem('organix_token');
  };

  const renderDashboard = () => {
    if (!user || !accessToken) return null;

    switch (user.role) {
      case 'patient':
        return <PatientDashboard user={user} accessToken={accessToken} />;
      case 'donor':
        return <DonorDashboard user={user} accessToken={accessToken} />;
      case 'hospital':
        return <HospitalDashboard user={user} accessToken={accessToken} />;
      case 'sponsor':
        return <SponsorDashboard user={user} accessToken={accessToken} />;
      case 'admin':
        return <AdminDashboard user={user} accessToken={accessToken} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unknown user role</p>
          </div>
        );
    }
  };

  if (currentView === 'landing') {
    return (
      <LandingPage onGetStarted={() => setCurrentView('auth')} />
    );
  }

  if (currentView === 'auth') {
    return (
      <AuthPage
        onLogin={handleLogin}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'dashboard' && user) {
    return (
      <DashboardLayout user={user} onLogout={handleLogout}>
        {renderDashboard()}
      </DashboardLayout>
    );
  }

  return null;
}