import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/team/accept?token=xxx - Get invitation details
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const serviceSupabase = getServiceSupabase();

    // Get invitation details
    const { data: invitation, error } = await serviceSupabase
      .from('team_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        accepted_at,
        issuer:issuers(id, name, display_name)
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({
        error: 'Invitation already accepted',
        status: 'accepted',
      }, { status: 400 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({
        error: 'Invitation has expired',
        status: 'expired',
      }, { status: 400 });
    }

    const issuer = invitation.issuer as unknown as { id: string; name: string; display_name?: string } | null;

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        issuer_name: issuer?.display_name || issuer?.name || 'Unknown Organization',
      },
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/team/accept - Accept an invitation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const serviceSupabase = getServiceSupabase();

    // Get and validate invitation
    const { data: invitation, error: fetchError } = await serviceSupabase
      .from('team_invitations')
      .select('id, email, role, expires_at, accepted_at, issuer_id')
      .eq('token', token)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Verify email matches (optional - could be relaxed)
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({
        error: 'This invitation was sent to a different email address',
      }, { status: 403 });
    }

    // Check if user is already a team member
    const { data: existingMember } = await serviceSupabase
      .from('team_members')
      .select('id')
      .eq('issuer_id', invitation.issuer_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      // Mark invitation as accepted anyway
      await serviceSupabase
        .from('team_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return NextResponse.json({
        message: 'You are already a member of this team',
        already_member: true,
      });
    }

    // Create team membership
    const { error: memberError } = await serviceSupabase
      .from('team_members')
      .insert({
        issuer_id: invitation.issuer_id,
        user_id: user.id,
        role: invitation.role,
        status: 'active',
      });

    if (memberError) {
      console.error('Failed to create team membership:', memberError);
      return NextResponse.json({ error: 'Failed to join team' }, { status: 500 });
    }

    // Mark invitation as accepted
    await serviceSupabase
      .from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    // Log to audit
    await serviceSupabase.from('audit_logs').insert({
      issuer_id: invitation.issuer_id,
      user_id: user.id,
      action: 'team.member_joined',
      resource_type: 'team_member',
      resource_id: user.id,
      details: { role: invitation.role, invitation_id: invitation.id },
    });

    // Get issuer name for response
    const { data: issuer } = await serviceSupabase
      .from('issuers')
      .select('name, display_name')
      .eq('id', invitation.issuer_id)
      .single();

    return NextResponse.json({
      message: 'Successfully joined the team',
      issuer_name: issuer?.display_name || issuer?.name || 'the organization',
      role: invitation.role,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
