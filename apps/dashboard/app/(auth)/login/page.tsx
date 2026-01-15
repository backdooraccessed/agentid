'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      toast.error('Sign in failed', { description: error.message });
      setLoading(false);
      return;
    }

    toast.success('Welcome back!', { description: 'Redirecting to dashboard...' });
    router.push('/credentials');
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="font-mono text-3xl font-bold tracking-tight uppercase">Welcome Back</h1>
        <p className="text-muted-foreground font-mono text-sm">
          Sign in to your account to manage your credentials
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="border-2 border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 font-mono text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="font-mono text-sm font-bold uppercase block">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full h-12 px-4 bg-white/[0.02] border-2 border-white/10 font-mono focus:border-white/30 focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="font-mono text-sm font-bold uppercase block">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="font-mono text-xs text-white/70 hover:text-white transition-colors uppercase"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full h-12 px-4 bg-white/[0.02] border-2 border-white/10 font-mono focus:border-white/30 focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 bg-white text-black font-mono font-bold uppercase text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 font-mono text-xs uppercase text-muted-foreground">
            New to AgentID?
          </span>
        </div>
      </div>

      {/* Register link */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 font-mono text-sm font-medium text-white/70 hover:text-white transition-colors uppercase"
        >
          Create a free account
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
