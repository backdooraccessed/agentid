'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  const getStrengthColor = (passed: number) => {
    if (passed <= 1) return 'bg-red-500';
    if (passed === 2) return 'bg-amber-500';
    if (passed === 3) return 'bg-white/50';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = (passed: number) => {
    if (passed <= 1) return { text: 'Weak', color: 'text-red-400' };
    if (passed === 2) return { text: 'Fair', color: 'text-amber-400' };
    if (passed === 3) return { text: 'Good', color: 'text-white/70' };
    return { text: 'Strong', color: 'text-emerald-400' };
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
        <h1 className="font-display text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">
          Start issuing verifiable credentials for your AI agents
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <Alert className="border-red-500/20 bg-red-500/5">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-12 px-4 bg-white/[0.02] border-white/10 focus:border-white/30 focus:ring-white/10"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="h-12 px-4 bg-white/[0.02] border-white/10 focus:border-white/30 focus:ring-white/10"
          />
          {password && (
            <div className="space-y-3 p-4 rounded-lg bg-white/[0.02] border border-white/10">
              {/* Strength bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Password strength</span>
                  <span className={cn('font-medium', strengthLabel.color)}>
                    {strengthLabel.text}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-all duration-300',
                        i < passwordStrength.passed
                          ? getStrengthColor(passwordStrength.passed)
                          : 'bg-white/10'
                      )}
                    />
                  ))}
                </div>
              </div>
              {/* Requirements */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <PasswordCheck passed={passwordStrength.checks.length} label="8+ characters" />
                <PasswordCheck passed={passwordStrength.checks.uppercase} label="Uppercase" />
                <PasswordCheck passed={passwordStrength.checks.lowercase} label="Lowercase" />
                <PasswordCheck passed={passwordStrength.checks.number} label="Number" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className={cn(
              'h-12 px-4 bg-white/[0.02] border-white/10 focus:border-white/30 focus:ring-white/10',
              confirmPassword && password !== confirmPassword && 'border-red-500/30 focus:border-red-500/50'
            )}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" />
              Passwords do not match
            </p>
          )}
          {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Passwords match
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-medium btn-glow"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Terms */}
        <p className="text-xs text-muted-foreground text-center">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-white/70 hover:text-white underline-offset-4 hover:underline">
            Terms of Service
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
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Already have an account?
          </span>
        </div>
      </div>

      {/* Login link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
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
        'flex items-center gap-2 text-xs transition-colors',
        passed
          ? 'text-emerald-400'
          : 'text-muted-foreground'
      )}
    >
      {passed ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <div className="h-3.5 w-3.5 rounded-full border border-white/20" />
      )}
      {label}
    </div>
  );
}
