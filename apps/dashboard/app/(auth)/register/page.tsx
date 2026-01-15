'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Loader2, Check, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const passwordStrength = useMemo(() => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    return { checks, passed, total: 4 };
  }, [password]);

  const getStrengthLabel = (passed: number) => {
    if (passed <= 1) return { text: 'WEAK', color: 'text-red-400' };
    if (passed === 2) return { text: 'FAIR', color: 'text-amber-400' };
    if (passed === 3) return { text: 'GOOD', color: 'text-white/70' };
    return { text: 'STRONG', color: 'text-emerald-400' };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Validation error', { description: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      toast.error('Validation error', { description: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      toast.error('Registration failed', { description: error.message });
      setLoading(false);
      return;
    }

    toast.success('Account created!', { description: 'Welcome to AgentID' });
    router.push('/credentials');
    router.refresh();
  };

  const strengthLabel = getStrengthLabel(passwordStrength.passed);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="font-mono text-3xl font-bold tracking-tight uppercase">Create Account</h1>
        <p className="text-muted-foreground font-mono text-sm">
          Start issuing verifiable credentials for your AI agents
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-5">
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

        <div className="space-y-3">
          <label htmlFor="password" className="font-mono text-sm font-bold uppercase block">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full h-12 px-4 bg-white/[0.02] border-2 border-white/10 font-mono focus:border-white/30 focus:outline-none transition-colors"
          />
          {password && (
            <div className="space-y-3 p-4 border-2 border-white/10 bg-white/[0.02]">
              {/* Strength bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground uppercase">Password strength</span>
                  <span className={cn('font-mono text-xs font-bold', strengthLabel.color)}>
                    {strengthLabel.text}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-2 flex-1 transition-all duration-300',
                        i < passwordStrength.passed
                          ? passwordStrength.passed <= 1 ? 'bg-red-500' :
                            passwordStrength.passed === 2 ? 'bg-amber-500' :
                            passwordStrength.passed === 3 ? 'bg-white/50' : 'bg-emerald-500'
                          : 'bg-white/10'
                      )}
                    />
                  ))}
                </div>
              </div>
              {/* Requirements */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <PasswordCheck passed={passwordStrength.checks.length} label="8+ CHARS" />
                <PasswordCheck passed={passwordStrength.checks.uppercase} label="UPPERCASE" />
                <PasswordCheck passed={passwordStrength.checks.lowercase} label="LOWERCASE" />
                <PasswordCheck passed={passwordStrength.checks.number} label="NUMBER" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="font-mono text-sm font-bold uppercase block">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className={cn(
              'w-full h-12 px-4 bg-white/[0.02] border-2 border-white/10 font-mono focus:border-white/30 focus:outline-none transition-colors',
              confirmPassword && password !== confirmPassword && 'border-red-500/30 focus:border-red-500/50'
            )}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="font-mono text-xs text-red-400 flex items-center gap-1.5 uppercase">
              <X className="h-3.5 w-3.5" />
              Passwords do not match
            </p>
          )}
          {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
            <p className="font-mono text-xs text-emerald-400 flex items-center gap-1.5 uppercase">
              <Check className="h-3.5 w-3.5" />
              Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full h-12 bg-white text-black font-mono font-bold uppercase text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Terms */}
        <p className="font-mono text-xs text-muted-foreground text-center">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-white/70 hover:text-white underline-offset-4 hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-white/70 hover:text-white underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 font-mono text-xs uppercase text-muted-foreground">
            Already have an account?
          </span>
        </div>
      </div>

      {/* Login link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-mono text-sm font-medium text-white/70 hover:text-white transition-colors uppercase"
        >
          Sign in to your account
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 font-mono text-xs transition-colors',
        passed ? 'text-emerald-400' : 'text-muted-foreground'
      )}
    >
      {passed ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <div className="h-3.5 w-3.5 border border-white/20" />
      )}
      {label}
    </div>
  );
}
