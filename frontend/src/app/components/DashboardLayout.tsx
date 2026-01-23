import { ReactNode } from 'react';
import { Heart, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

interface DashboardLayoutProps {
  children: ReactNode;
  user: any;
  onLogout: () => void;
}

export function DashboardLayout({ children, user, onLogout }: DashboardLayoutProps) {
  const getRoleDisplay = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Healthcare-themed badge colors using new design system
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'patient':
        return 'bg-[#0077B6] text-white'; // Primary Blue
      case 'donor':
        return 'bg-[#27AE60] text-white'; // Success Green
      case 'hospital':
        return 'bg-[#4A9FCC] text-white'; // Accent Blue
      case 'sponsor':
        return 'bg-[#F39C12] text-white'; // Warning Orange
      case 'admin':
        return 'bg-[#2B2D42] text-white'; // Dark Gray
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header - Professional healthcare design */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#0077B6] to-[#4A9FCC] rounded-xl flex items-center justify-center shadow-md transition-transform hover:scale-105">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0077B6] tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Organix
                </h1>
                <p className="text-xs text-[#6B7280] hidden sm:block" style={{ fontFamily: 'var(--font-body)' }}>
                  Healthcare Coordination Platform
                </p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Role Badge */}
              <div className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm ${getRoleBadgeColor(user.role)}`}
                   style={{ fontFamily: 'var(--font-heading)' }}>
                {getRoleDisplay(user.role)}
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hover:bg-[#F5F7FA] transition-colors"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel style={{ fontFamily: 'var(--font-heading)' }}>
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm text-[#6B7280]" style={{ fontFamily: 'var(--font-body)' }}>
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-[#6B7280]" style={{ fontFamily: 'var(--font-body)' }}>
                    Role: {getRoleDisplay(user.role)}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sign Out Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="border-[#E5E7EB] hover:border-[#0077B6] hover:text-[#0077B6] hover:bg-[#e6f4f9] transition-all"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Clean and spacious */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="fade-in">
          {children}
        </div>
      </main>

      {/* Footer - Professional and informative */}
      <footer className="bg-white border-t border-[#E5E7EB] mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0077B6] to-[#4A9FCC] rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" fill="white" />
                </div>
                <span className="text-lg font-bold text-[#0077B6]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Organix
                </span>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                Professional healthcare coordination platform connecting donors, patients, and sponsors.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-[#2B2D42] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm text-[#6B7280]" style={{ fontFamily: 'var(--font-body)' }}>
                <li><a href="#" className="hover:text-[#0077B6] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#0077B6] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#0077B6] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#0077B6] transition-colors">Contact Support</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-[#2B2D42] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Support
              </h4>
              <ul className="space-y-2 text-sm text-[#6B7280]" style={{ fontFamily: 'var(--font-body)' }}>
                <li>Emergency: <span className="text-[#E63946] font-semibold">911</span></li>
                <li>Support: <span className="text-[#0077B6] font-semibold">1-800-ORGANIX</span></li>
                <li>Email: <span className="text-[#0077B6]">support@organix.health</span></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t border-[#E5E7EB] text-center">
            <p className="text-sm text-[#6B7280]" style={{ fontFamily: 'var(--font-body)' }}>
              &copy; 2026 InnoveraTech. All rights reserved.
            </p>
            <p className="text-xs text-[#6B7280] mt-2" style={{ fontFamily: 'var(--font-body)' }}>
              Organix is a healthcare coordination platform. All medical decisions require licensed healthcare provider approval.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
