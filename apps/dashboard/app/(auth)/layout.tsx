import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary text-lg font-bold">
              A
            </span>
            <span className="text-2xl font-bold">AgentID</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Credential Infrastructure<br />for AI Agents
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Issue verifiable credentials to your AI agents. Enable any service to verify agent identity and permissions.
            </p>
            <div className="flex items-center gap-8 text-sm">
              <div>
                <div className="text-2xl font-bold">10,000+</div>
                <div className="text-primary-foreground/70">Credentials Issued</div>
              </div>
              <div>
                <div className="text-2xl font-bold">50ms</div>
                <div className="text-primary-foreground/70">Avg. Verification</div>
              </div>
              <div>
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-primary-foreground/70">Uptime</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-primary-foreground/60">
            &copy; {new Date().getFullYear()} AgentID. Open source under MIT license.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold">
                A
              </span>
              <span className="text-xl font-bold">AgentID</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
