import Link from 'next/link';
import { Shield, Github } from 'lucide-react';
import { LightThemeWrapper } from '@/components/theme-wrapper';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LightThemeWrapper>
      <div className="min-h-screen bg-white text-black font-retro">
        {/* Dotted Background Pattern */}
        <div className="fixed inset-0 dot-pattern pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black flex items-center justify-center block-shadow-sm group-hover:animate-block-wiggle">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-retro font-bold text-xl uppercase tracking-tight">AgentID</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-retro text-sm uppercase tracking-wider">
            <Link href="/#features" className="hover:underline underline-offset-4 decoration-2">Features</Link>
            <Link href="/marketplace" className="underline underline-offset-4 decoration-2">Marketplace</Link>
            <Link href="/docs" className="hover:underline underline-offset-4 decoration-2">Docs</Link>
            <Link href="/pricing" className="hover:underline underline-offset-4 decoration-2">Pricing</Link>
            <Link href="https://github.com/agentid" className="hover:underline underline-offset-4 decoration-2">
              <Github className="w-5 h-5" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="font-retro font-bold text-sm uppercase px-4 py-2 hover:bg-gray-100 border-2 border-black">
                Sign In
              </button>
            </Link>
            <Link href="/apps/new">
              <button className="font-retro font-bold text-sm uppercase px-4 py-2 bg-black text-white btn-retro">
                Submit App
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative">{children}</main>

      {/* Footer */}
      <footer className="border-t-4 border-black py-12 relative bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-retro font-bold uppercase">AgentID</span>
              </div>
              <p className="font-retro text-sm text-gray-600">
                Trust infrastructure for autonomous AI agents.
              </p>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Product</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><Link href="/docs" className="hover:underline">Documentation</Link></li>
                <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
                <li><Link href="/marketplace" className="hover:underline">Marketplace</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Company</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><Link href="/terms" className="hover:underline">Terms</Link></li>
                <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-retro font-bold uppercase mb-4">Connect</h4>
              <ul className="space-y-2 font-retro text-sm text-gray-600">
                <li><a href="https://github.com/agentid" className="hover:underline">GitHub</a></li>
                <li><a href="https://twitter.com/agentid" className="hover:underline">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-black text-center font-retro text-sm text-gray-600">
            <span className="font-pixel">&copy; 2024 AgentID</span> — Identity for autonomous AI agents
          </div>
        </div>
      </footer>
    </div>
    </LightThemeWrapper>
  );
}
