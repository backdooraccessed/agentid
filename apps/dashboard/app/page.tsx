import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">AgentID</h1>
        <p className="text-xl text-muted-foreground">
          Credential and Reputation Infrastructure for AI Agents
        </p>
        <p className="text-muted-foreground">
          Issue verifiable credentials to your AI agents. Enable services to verify
          agent identity, permissions, and trustworthiness.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Get Started
          </Link>
        </div>

        <div className="flex gap-6 justify-center text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-foreground hover:underline">
            Documentation
          </Link>
          <Link href="/directory" className="hover:text-foreground hover:underline">
            Issuer Directory
          </Link>
        </div>

        <div className="pt-8 border-t">
          <h2 className="text-lg font-semibold mb-4">Verification API</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Verify agent credentials with a simple POST request:
          </p>
          <pre className="bg-muted p-4 rounded-md text-left text-sm overflow-x-auto">
{`POST /api/verify
{
  "credential_id": "uuid"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
