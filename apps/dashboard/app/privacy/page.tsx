import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy Policy | AgentID',
  description: 'Privacy Policy for AgentID - How we collect, use, and protect your data',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b-4 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold">AgentID</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="font-pixel text-4xl text-black uppercase mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: January 15, 2025</p>
        </div>

        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">1. Introduction</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              AgentID (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our credential infrastructure service.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-black mt-6 mb-3">Account Information</h3>
            <ul className="list-disc list-inside font-retro text-gray-700 space-y-2">
              <li>Email address</li>
              <li>Organization name</li>
              <li>Domain information for verification</li>
            </ul>

            <h3 className="text-lg font-medium text-black mt-6 mb-3">Credential Data</h3>
            <ul className="list-disc list-inside font-retro text-gray-700 space-y-2">
              <li>AI agent identifiers and names</li>
              <li>Credential metadata and capabilities</li>
              <li>Verification timestamps and logs</li>
            </ul>

            <h3 className="text-lg font-medium text-black mt-6 mb-3">Usage Information</h3>
            <ul className="list-disc list-inside font-retro text-gray-700 space-y-2">
              <li>API request logs</li>
              <li>Feature usage analytics</li>
              <li>Error reports and diagnostics</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">3. How We Use Your Information</h2>
            <p className="font-retro text-gray-700 leading-relaxed">We use collected information to:</p>
            <ul className="list-disc list-inside font-retro text-gray-700 space-y-2 mt-4">
              <li>Provide and maintain the Service</li>
              <li>Process credential issuance and verification requests</li>
              <li>Send important notifications about your account</li>
              <li>Improve and optimize the Service</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">4. Data Sharing</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside font-retro text-gray-700 space-y-2 mt-4">
              <li><strong className="text-black">Service Providers:</strong> Third parties that help us operate the Service</li>
              <li><strong className="text-black">Verification Requests:</strong> Public credential data when verification is requested</li>
              <li><strong className="text-black">Legal Requirements:</strong> When required by law or to protect rights</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">5. Data Security</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside font-retro text-gray-700 space-y-2 mt-4">
              <li>Encryption in transit (TLS 1.3) and at rest</li>
              <li>Ed25519 cryptographic signatures for credentials</li>
              <li>Row Level Security (RLS) for database access</li>
              <li>Regular security audits and monitoring</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">6. Data Retention</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide
              services. Verification logs are retained for 90 days. You may request deletion of
              your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">7. Your Rights</h2>
            <p className="font-retro text-gray-700 leading-relaxed">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside font-retro text-gray-700 space-y-2 mt-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Object to certain processing activities</li>
              <li>Withdraw consent where applicable</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">8. International Transfers</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your
              own. We ensure appropriate safeguards are in place to protect your data in accordance
              with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">9. Cookies</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              We use essential cookies for authentication and session management. We do not use
              third-party tracking cookies. You can control cookie preferences in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">10. Changes to This Policy</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of material changes
              via email or through the Service. Your continued use after changes indicates acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">11. Contact Us</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              For privacy-related inquiries, please contact us at{' '}
              <a href="mailto:privacy@agentid.dev" className="text-black underline underline-offset-2">
                privacy@agentid.dev
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">© 2025 AgentID. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-black transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-black transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
