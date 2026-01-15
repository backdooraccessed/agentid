'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Loader2, Check, X, ArrowRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    };
    checkSession();
  }, [supabase.auth]);

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
    if (passed <= 1) return { text: 'WEAK', color: 'text-red-600' };
    if (passed === 2) return { text: 'FAIR', color: 'text-amber-600' };
    if (passed === 3) return { text: 'GOOD', color: 'text-gray-600' };
    return { text: 'STRONG', color: 'text-emerald-600' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      toast.error('Failed to reset password', { description: error.message });
      setLoading(false);
      return;
    }

    toast.success('Password updated!', { description: 'You can now sign in with your new password' });
    router.push('/credentials');
    router.refresh();
  };

  const strengthLabel = getStrengthLabel(passwordStrength.passed);

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  // Invalid/expired session
  if (!isValidSession) {
    return (
      <div className="space-y-8">
        <div className="space-y-4 text-center lg:text-left">
          <div className="w-16 h-16 bg-red-100 border-4 border-red-500 flex items-center justify-center mx-auto lg:mx-0">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="font-pixel text-3xl text-black uppercase">Link Expired</h1>
          <p className="text-gray-600 font-retro text-sm">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="w-full h-12 bg-black text-white font-retro font-bold uppercase text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          Request new reset link
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="font-pixel text-3xl text-black uppercase">New Password</h1>
        <p className="text-gray-600 font-retro text-sm">
          Enter your new password below
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="border-4 border-red-500 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 font-retro text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <label htmlFor="password" className="font-retro text-sm font-bold uppercase block text-black">
            New Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full h-12 px-4 bg-white border-2 border-gray-300 font-retro text-black focus:border-black focus:outline-none transition-colors"
          />
          {password && (
            <div className="space-y-3 p-4 border-2 border-gray-300 bg-gray-50">
              {/* Strength bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-retro text-xs text-gray-600 uppercase">Password strength</span>
                  <span className={cn('font-retro text-xs font-bold', strengthLabel.color)}>
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
                            passwordStrength.passed === 3 ? 'bg-gray-400' : 'bg-emerald-500'
                          : 'bg-gray-200'
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
          <label htmlFor="confirmPassword" className="font-retro text-sm font-bold uppercase block text-black">
            Confirm Password
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
              'w-full h-12 px-4 bg-white border-2 border-gray-300 font-retro text-black focus:border-black focus:outline-none transition-colors',
              confirmPassword && password !== confirmPassword && 'border-red-500 focus:border-red-600'
            )}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="font-retro text-xs text-red-600 flex items-center gap-1.5 uppercase">
              <X className="h-3.5 w-3.5" />
              Passwords do not match
            </p>
          )}
          {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
            <p className="font-retro text-xs text-emerald-600 flex items-center gap-1.5 uppercase">
              <Check className="h-3.5 w-3.5" />
              Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full h-12 bg-black text-white font-retro font-bold uppercase text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Update password
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 font-retro text-xs transition-colors',
        passed ? 'text-emerald-600' : 'text-gray-500'
      )}
    >
      {passed ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <div className="h-3.5 w-3.5 border border-gray-300" />
      )}
      {label}
    </div>
  );
}
