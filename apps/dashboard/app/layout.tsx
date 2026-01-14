import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentID - Trust Infrastructure for AI Agents',
  description: 'Issue verifiable credentials for your AI agents. Enable any service to verify agent identity, permissions, and trustworthiness.',
  keywords: ['AI agents', 'credentials', 'verification', 'trust', 'identity', 'authentication'],
  openGraph: {
    title: 'AgentID - Trust Infrastructure for AI Agents',
    description: 'Issue verifiable credentials for your AI agents.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
