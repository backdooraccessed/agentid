'use client';

import { Home, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto text-gray-300"
          >
            {/* Broken link illustration */}
            <circle cx="70" cy="80" r="30" stroke="currentColor" strokeWidth="2" />
            <circle cx="130" cy="80" r="30" stroke="currentColor" strokeWidth="2" />
            <path d="M95 80H105" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
            <path d="M50 80L40 70M50 80L40 90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M150 80L160 70M150 80L160 90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

            {/* Question marks */}
            <text x="65" y="88" fill="currentColor" fontSize="24" fontWeight="bold" opacity="0.5">?</text>
            <text x="125" y="88" fill="currentColor" fontSize="24" fontWeight="bold" opacity="0.5">?</text>
          </svg>
        </div>

        {/* Error text */}
        <h1 className="text-7xl font-bold text-gray-200 mb-4 font-pixel">404</h1>
        <h2 className="text-2xl font-semibold mb-2 font-retro">Page not found</h2>
        <p className="text-gray-600 mb-8 font-retro">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-gray-300 hover:bg-gray-100"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link href="/">
            <Button className="gap-2 bg-black text-white hover:bg-gray-800">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-500 mb-4 font-retro">Looking for something?</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/docs" className="text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-1 font-retro">
              <Search className="w-3 h-3" />
              Documentation
            </Link>
            <Link href="/credentials" className="text-sm text-gray-600 hover:text-black transition-colors font-retro">
              Credentials
            </Link>
            <Link href="/directory" className="text-sm text-gray-600 hover:text-black transition-colors font-retro">
              Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
