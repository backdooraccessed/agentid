import Link from 'next/link';
import { Bot, Search } from 'lucide-react';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <Bot className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="font-display text-xl font-bold text-white">AgentID</span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/marketplace"
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href="/docs"
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/login"
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/apps/new"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Submit App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-sm">
              © 2026 AgentID. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-white/40 hover:text-white/60 text-sm">
                Terms
              </Link>
              <Link href="/privacy" className="text-white/40 hover:text-white/60 text-sm">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
