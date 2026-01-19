import { Heart, Users, Building2, Sparkles, Shield, Activity } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Organix</h1>
              <p className="text-xs text-muted-foreground">by InnoveraTech</p>
            </div>
          </div>
          <Button onClick={onGetStarted} variant="default">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Innovation with Impact
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Ethical Organ Donation,
            <br />
            <span className="text-primary">Transparent & Accessible</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Organix connects patients, donors, hospitals, and sponsors to reduce transplant waiting time,
            increase transparency, and save lives — while strictly preventing organ trade.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button onClick={onGetStarted} size="lg" className="text-lg px-8">
              Join the Platform
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-gray-600">Ethical & Transparent</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">24/7</div>
              <div className="text-sm text-gray-600">Platform Access</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">0</div>
              <div className="text-sm text-gray-600">Organ Trading</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Organix Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A coordinated ecosystem ensuring ethical organ donation and transplantation
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Patients</h3>
                <p className="text-sm text-gray-600">
                  Register your case, track status, and receive support throughout your journey
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Donors</h3>
                <p className="text-sm text-gray-600">
                  Provide voluntary consent, maintain anonymity, and save lives ethically
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Hospitals</h3>
                <p className="text-sm text-gray-600">
                  Manage cases, review matches, and make all medical decisions
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-chart-4 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Sponsors</h3>
                <p className="text-sm text-gray-600">
                  Fund transplant cases, track impact, and support communities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Principles</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Healthcare-grade ethics and compliance built into every feature
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Zero Organ Trade</h3>
              <p className="text-sm text-gray-600">
                No buying or selling. Only ethical, voluntary donations with full transparency and oversight.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Complete Anonymity</h3>
              <p className="text-sm text-gray-600">
                Donor identity is protected by default. Patients and donors never interact directly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Hospital-Led Care</h3>
              <p className="text-sm text-gray-600">
                All medical decisions made by licensed hospitals. Organix is a coordination platform, not a provider.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join Organix today and be part of a life-saving platform that prioritizes ethics, transparency, and impact.
          </p>
          <Button onClick={onGetStarted} size="lg" variant="secondary" className="text-lg px-8">
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Organix</h3>
                  <p className="text-xs text-gray-400">by InnoveraTech</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Innovation with Impact
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>For Patients</li>
                <li>For Donors</li>
                <li>For Hospitals</li>
                <li>For Sponsors</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>About Us</li>
                <li>Ethics Policy</li>
                <li>Compliance</li>
                <li>Contact</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Data Protection</li>
                <li>HIPAA Compliance</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 InnoveraTech. All rights reserved. Organix is a healthcare coordination platform.</p>
            <p className="mt-2">For demonstration purposes. Production deployment requires additional compliance measures.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
