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
        <h1 className="font-pixel text-3xl text-black uppercase">Welcome Back</h1>
        <p className="text-gray-600 font-retro text-sm">
          Sign in to your account to manage your credentials
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="border-4 border-red-500 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 font-retro text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="font-retro text-sm font-bold uppercase block text-black">
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
            className="w-full h-12 px-4 bg-white border-2 border-gray-300 font-retro text-black focus:border-black focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="font-retro text-sm font-bold uppercase block text-black">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="font-retro text-xs text-gray-600 hover:text-black transition-colors uppercase"
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
            className="w-full h-12 px-4 bg-white border-2 border-gray-300 font-retro text-black focus:border-black focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 bg-black text-white font-retro font-bold uppercase text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="w-full border-t-2 border-gray-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 font-retro text-xs uppercase text-gray-600">
            New to AgentID?
          </span>
        </div>
      </div>

      {/* Register link */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 font-retro text-sm font-medium text-gray-600 hover:text-black transition-colors uppercase"
        >
          Create a free account
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
