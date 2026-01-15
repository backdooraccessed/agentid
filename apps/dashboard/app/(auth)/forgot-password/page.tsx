'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      toast.error('Failed to send reset email', { description: error.message });
      setLoading(false);
      return;
    }

    setSubmitted(true);
    toast.success('Reset email sent!', { description: 'Check your inbox for instructions' });
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="space-y-8">
        {/* Success State */}
        <div className="space-y-4 text-center lg:text-left">
          <div className="w-16 h-16 bg-emerald-100 border-4 border-emerald-500 flex items-center justify-center mx-auto lg:mx-0">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="font-pixel text-3xl text-black uppercase">Check Your Email</h1>
          <p className="text-gray-600 font-retro text-sm">
            We&apos;ve sent password reset instructions to <span className="font-bold text-black">{email}</span>
          </p>
        </div>

        <div className="border-4 border-gray-300 bg-gray-50 p-4 space-y-3">
          <p className="font-retro text-sm text-gray-600">
            Didn&apos;t receive the email? Check your spam folder or try again with a different email address.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
            className="w-full h-12 bg-white border-2 border-gray-300 text-black font-retro font-bold uppercase text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Try another email
          </button>

          <Link
            href="/login"
            className="w-full h-12 bg-black text-white font-retro font-bold uppercase text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="font-pixel text-3xl text-black uppercase">Reset Password</h1>
        <p className="text-gray-600 font-retro text-sm">
          Enter your email address and we&apos;ll send you instructions to reset your password
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

        <button
          type="submit"
          className="w-full h-12 bg-black text-white font-retro font-bold uppercase text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Send reset instructions
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
            Remember your password?
          </span>
        </div>
      </div>

      {/* Back to login link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-retro text-sm font-medium text-gray-600 hover:text-black transition-colors uppercase"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
