'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  issuer_name: string;
}

type InviteStatus = 'loading' | 'valid' | 'expired' | 'accepted' | 'error' | 'success' | 'accepting';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndFetchInvite() {
      // Check if user is logged in
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setUserEmail(user?.email || null);

      // Fetch invitation details
      try {
        const res = await fetch(`/api/team/accept?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setInvitation(data.invitation);
          setStatus('valid');
        } else {
          if (data.status === 'expired') {
            setStatus('expired');
            setError('This invitation has expired. Please ask for a new invitation.');
          } else if (data.status === 'accepted') {
            setStatus('accepted');
            setError('This invitation has already been accepted.');
          } else {
            setStatus('error');
            setError(data.error || 'Failed to load invitation');
          }
        }
      } catch {
        setStatus('error');
        setError('Failed to load invitation');
      }
    }

    checkAuthAndFetchInvite();
  }, [token]);

  const handleAccept = async () => {
    setStatus('accepting');

    try {
      const res = await fetch('/api/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setSuccessMessage(data.message);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/credentials');
        }, 2000);
      } else {
        setStatus('valid');
        setError(data.error || 'Failed to accept invitation');
      }
    } catch {
      setStatus('valid');
      setError('Failed to accept invitation');
    }
  };

  const handleLogin = () => {
    // Redirect to login with return URL
    router.push(`/login?redirect=/invite/${token}`);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Owner',
      admin: 'Administrator',
      member: 'Member',
      viewer: 'Viewer',
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-black" />
          </div>
          <h2 className="font-pixel text-xl text-black uppercase">Team Invitation</h2>
          <p className="font-retro text-gray-600">
            {status === 'loading' && 'Loading invitation details...'}
            {status === 'valid' && invitation && `Join ${invitation.issuer_name}`}
            {status === 'expired' && 'Invitation Expired'}
            {status === 'accepted' && 'Already Accepted'}
            {status === 'error' && 'Invalid Invitation'}
            {status === 'success' && 'Welcome to the team!'}
            {status === 'accepting' && 'Joining team...'}
          </p>
        </div>

        <div className="p-4 space-y-6">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
          )}

          {/* Valid Invitation */}
          {status === 'valid' && invitation && (
            <>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-retro text-gray-600">Organization</p>
                    <p className="text-black font-medium font-retro">{invitation.issuer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-retro text-gray-600">Your Role</p>
                    <p className="text-black font-medium font-retro">{getRoleLabel(invitation.role)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-retro text-gray-600">Invited Email</p>
                    <p className="text-black font-medium font-retro">{invitation.email}</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-retro text-red-600">{error}</p>
                  </div>
                )}

                {isLoggedIn === false && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                    <p className="text-sm font-retro text-yellow-600">
                      Please log in with <strong>{invitation.email}</strong> to accept this invitation.
                    </p>
                  </div>
                )}

                {isLoggedIn === true && userEmail?.toLowerCase() !== invitation.email.toLowerCase() && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                    <p className="text-sm font-retro text-yellow-600">
                      You are logged in as <strong>{userEmail}</strong>, but this invitation was sent to <strong>{invitation.email}</strong>.
                    </p>
                  </div>
                )}
              </div>

              {isLoggedIn ? (
                <Button
                  onClick={handleAccept}
                  className="w-full"
                  disabled={userEmail?.toLowerCase() !== invitation.email.toLowerCase()}
                >
                  Accept Invitation
                </Button>
              ) : (
                <Button onClick={handleLogin} className="w-full">
                  Log in to Accept
                </Button>
              )}
            </>
          )}

          {/* Accepting State */}
          {status === 'accepting' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="h-8 w-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              <p className="font-retro text-gray-600">Joining the team...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="font-retro text-gray-600 text-center">{successMessage}</p>
              <p className="text-sm font-retro text-gray-600">Redirecting to dashboard...</p>
            </div>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="font-retro text-gray-600 text-center">{error}</p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Homepage
              </Button>
            </div>
          )}

          {/* Already Accepted State */}
          {status === 'accepted' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <p className="font-retro text-gray-600 text-center">{error}</p>
              <Button onClick={() => router.push('/credentials')}>
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="font-retro text-gray-600 text-center">{error}</p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Homepage
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
