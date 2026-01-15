'use client';

import Link from 'next/link';
import { Shield, Github, ExternalLink } from 'lucide-react';

function LogoMark({ className }: { className?: string }) {
  return (
    <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${className}`}>
      <Shield className="w-4 h-4 text-black" />
    </div>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

function FooterLink({ href, children, external }: FooterLinkProps) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
      {external && <ExternalLink className="w-3 h-3" />}
    </Link>
  );
}

const footerLinks = {
  product: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Directory', href: '/directory' },
    { label: 'API Reference', href: '/docs#api' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'GitHub', href: 'https://github.com/agentid', external: true },
    { label: 'Twitter', href: 'https://twitter.com/agentid', external: true },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Security', href: '/security' },
    { label: 'Status', href: 'https://status.agentid.dev', external: true },
  ],
  developers: [
    { label: 'Quick Start', href: '/docs#quickstart' },
    { label: 'SDKs', href: '/docs#sdks' },
    { label: 'Webhooks', href: '/docs#webhooks' },
    { label: 'Examples', href: 'https://github.com/agentid/examples', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Main footer content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <LogoMark />
              <span className="font-display text-xl font-bold">AgentID</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6">
              Identity infrastructure for the autonomous agent economy.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <Link
                href="https://github.com/agentid"
                className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4" />
              </Link>
              <Link
                href="https://twitter.com/agentid"
                className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Developers</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.developers.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} external={'external' in link}>
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} external={'external' in link}>
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} external={'external' in link}>
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AgentID. All rights reserved.
          </p>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
