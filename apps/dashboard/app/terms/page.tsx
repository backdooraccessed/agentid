import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Terms of Service | AgentID',
  description: 'Terms of Service for AgentID - Trust Infrastructure for AI Agents',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b-4 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
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
          <h1 className="font-pixel text-4xl text-black uppercase mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: January 15, 2025</p>
        </div>

        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">1. Acceptance of Terms</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              By accessing or using AgentID (&quot;Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">2. Description of Service</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              AgentID provides credential issuance and verification infrastructure for AI agents.
              Our Service allows you to issue cryptographic credentials for AI agents, verify credentials,
              and build trust relationships between autonomous systems.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">3. Account Registration</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside font-retro text-gray-700 space-y-2 mt-4">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">4. Acceptable Use</h2>
            <p className="font-retro text-gray-700 leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside font-retro text-gray-700 space-y-2 mt-4">
              <li>Use the Service for any unlawful purpose</li>
              <li>Issue credentials for malicious AI agents</li>
              <li>Attempt to circumvent security measures</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the Service to violate the rights of others</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">5. API Usage</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              Use of our API is subject to rate limits and usage quotas. Excessive use or abuse
              of the API may result in throttling or suspension of your account. You agree to
              comply with all API documentation and guidelines.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">6. Intellectual Property</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              The Service and its original content, features, and functionality are owned by
              AgentID and are protected by international copyright, trademark, and other
              intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">7. Limitation of Liability</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              AgentID shall not be liable for any indirect, incidental, special, consequential,
              or punitive damages resulting from your use of or inability to use the Service.
              The Service is provided &quot;as is&quot; without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">8. Termination</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              We may terminate or suspend your account and access to the Service immediately,
              without prior notice, for conduct that we believe violates these Terms or is
              harmful to other users, us, or third parties.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">9. Changes to Terms</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of
              significant changes via email or through the Service. Continued use of the Service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-2xl text-black mb-4">10. Contact</h2>
            <p className="font-retro text-gray-700 leading-relaxed">
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@agentid.dev" className="text-black underline underline-offset-2">
                legal@agentid.dev
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
