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
 * PATCH /api/a2a/conversations/[id]/messages/status - Update message delivery status
 *
 * Allows marking messages as delivered or read.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message_ids, action, credential_id } = body;

    // Validate required fields
    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
      return NextResponse.json(
        { error: 'message_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!action || !['delivered', 'read'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "delivered" or "read"' },
        { status: 400 }
      );
    }

    if (!credential_id) {
      return NextResponse.json(
        { error: 'credential_id is required' },
        { status: 400 }
      );
    }

    // Verify user owns the credential
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select('id, issuer_id')
      .eq('id', credential_id)
      .single();

    if (credError || !credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Check ownership
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('id', credential.issuer_id)
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json(
        { error: 'You do not own this credential' },
        { status: 403 }
      );
    }

    // Verify conversation exists and credential is a participant
    const serviceSupabase = getServiceSupabase();
    const { data: conversation, error: convError } = await serviceSupabase
      .from('a2a_conversations')
      .select('id, initiator_credential_id, recipient_credential_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant =
      conversation.initiator_credential_id === credential_id ||
      conversation.recipient_credential_id === credential_id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Credential is not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Update messages
    // Only allow marking messages sent BY THE OTHER participant
    // (you can't mark your own messages as delivered/read)
    const now = new Date().toISOString();
    let updateData: Record<string, unknown>;

    if (action === 'delivered') {
      updateData = {
        delivered: true,
        delivered_at: now,
      };
    } else {
      // 'read' also implies delivered
      updateData = {
        delivered: true,
        delivered_at: now, // Will be overwritten if already set due to Supabase behavior
        read_at: now,
      };
    }

    // Update messages that:
    // 1. Are in this conversation
    // 2. Are in the provided message_ids list
    // 3. Were NOT sent by the credential making this request (can't mark own messages)
    const { data: updated, error: updateError } = await serviceSupabase
      .from('a2a_messages')
      .update(updateData)
      .eq('conversation_id', conversationId)
      .in('id', message_ids)
      .neq('sender_credential_id', credential_id)
      .select('id');

    if (updateError) {
      console.error('Failed to update message status:', updateError);
      return NextResponse.json({ error: 'Failed to update message status' }, { status: 500 });
    }

    return NextResponse.json({
      updated_count: updated?.length || 0,
      action,
      message_ids: updated?.map((m) => m.id) || [],
    });
  } catch (error) {
    console.error('Update message status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/a2a/conversations/[id]/messages/status - Get unread/undelivered message counts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const credentialId = searchParams.get('credential_id');

    if (!credentialId) {
      return NextResponse.json({ error: 'credential_id required' }, { status: 400 });
    }

    // Verify user owns the credential
    const { data: credential } = await supabase
      .from('credentials')
      .select('id, issuer_id')
      .eq('id', credentialId)
      .single();

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('id', credential.issuer_id)
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json(
        { error: 'You do not own this credential' },
        { status: 403 }
      );
    }

    // Count undelivered and unread messages from the other participant
    const serviceSupabase = getServiceSupabase();

    const { data: undelivered, error: undeliveredError } = await serviceSupabase
      .from('a2a_messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .neq('sender_credential_id', credentialId)
      .eq('delivered', false);

    const { data: unread, error: unreadError } = await serviceSupabase
      .from('a2a_messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .neq('sender_credential_id', credentialId)
      .is('read_at', null);

    if (undeliveredError || unreadError) {
      console.error('Failed to get message counts:', undeliveredError || unreadError);
      return NextResponse.json({ error: 'Failed to get message counts' }, { status: 500 });
    }

    return NextResponse.json({
      conversation_id: conversationId,
      undelivered_count: undelivered?.length || 0,
      unread_count: unread?.length || 0,
    });
  } catch (error) {
    console.error('Get message status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
