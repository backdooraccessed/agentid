'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Error text */}
        <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-white/50 mb-2">
          An unexpected error occurred. Our team has been notified.
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-xs text-white/30 font-mono mb-8">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-white/20 hover:bg-white/5"
            onClick={reset}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button className="gap-2 bg-white text-black hover:bg-white/90">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Help text */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-white/40">
            If this problem persists, please contact{' '}
            <a
              href="mailto:support@agentid.dev"
              className="text-white/60 hover:text-white underline underline-offset-2"
            >
              support@agentid.dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
