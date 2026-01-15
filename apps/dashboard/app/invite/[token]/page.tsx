'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Team Invitation</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Loading invitation details...'}
            {status === 'valid' && invitation && `Join ${invitation.issuer_name}`}
            {status === 'expired' && 'Invitation Expired'}
            {status === 'accepted' && 'Already Accepted'}
            {status === 'error' && 'Invalid Invitation'}
            {status === 'success' && 'Welcome to the team!'}
            {status === 'accepting' && 'Joining team...'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
          )}

          {/* Valid Invitation */}
          {status === 'valid' && invitation && (
            <>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm text-white/50">Organization</p>
                    <p className="text-white font-medium">{invitation.issuer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Your Role</p>
                    <p className="text-white font-medium">{getRoleLabel(invitation.role)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Invited Email</p>
                    <p className="text-white font-medium">{invitation.email}</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {isLoggedIn === false && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-400">
                      Please log in with <strong>{invitation.email}</strong> to accept this invitation.
                    </p>
                  </div>
                )}

                {isLoggedIn === true && userEmail?.toLowerCase() !== invitation.email.toLowerCase() && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-400">
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
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              <p className="text-white/70">Joining the team...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="text-white/70 text-center">{successMessage}</p>
              <p className="text-sm text-white/50">Redirecting to dashboard...</p>
            </div>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
              <p className="text-white/70 text-center">{error}</p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Homepage
              </Button>
            </div>
          )}

          {/* Already Accepted State */}
          {status === 'accepted' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-white/70 text-center">{error}</p>
              <Button onClick={() => router.push('/credentials')}>
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-white/70 text-center">{error}</p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Homepage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
