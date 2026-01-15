import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { sendTeamInvitationEmail } from '@/lib/email';

/**
 * GET /api/team - Get team members for the issuer
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json({ error: 'Issuer not found' }, { status: 404 });
    }

    // Get team members
    const { data: members, error } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        role,
        status,
        created_at,
        updated_at
      `)
      .eq('issuer_id', issuer.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }

    // Get user emails (need to use auth admin for this, simplified here)
    // In production, you'd store invited_email or use a profiles table

    // Get pending invitations
    const { data: invitations } = await supabase
      .from('team_invitations')
      .select('id, email, role, created_at, expires_at')
      .eq('issuer_id', issuer.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());

    return NextResponse.json({
      members: members || [],
      invitations: invitations || [],
    });
  } catch (error) {
    console.error('Team fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/team - Invite a new team member
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer and verify user is owner/admin
    const { data: membership } = await supabase
      .from('team_members')
      .select('role, issuers!inner(id)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an owner or admin to invite team members' },
        { status: 403 }
      );
    }

    const issuerId = (membership.issuers as unknown as { id: string }).id;

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'email and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, member, or viewer' },
        { status: 400 }
      );
    }

    // Check if email is already invited
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('issuer_id', issuerId)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'This email already has a pending invitation' },
        { status: 409 }
      );
    }

    // Create invitation
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .insert({
        issuer_id: issuerId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Invitation error:', error);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Log to audit (fire and forget)
    void supabase.from('audit_logs').insert({
      issuer_id: issuerId,
      user_id: user.id,
      action: 'team.member_invited',
      resource_type: 'team_invitation',
      resource_id: invitation.id,
      details: { email, role },
    });

    // Get issuer name for the email
    const { data: issuerData } = await supabase
      .from('issuers')
      .select('name')
      .eq('id', issuerId)
      .single();

    // Send invitation email (fire and forget)
    void sendTeamInvitationEmail({
      email,
      inviterName: user.email || 'A team member',
      issuerName: issuerData?.name || 'your organization',
      role,
      token,
    });

    return NextResponse.json({
      message: 'Invitation sent',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        // Include invite link for development
        invite_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Team invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
