import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { isValidBase64 } from '@/lib/encryption';

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/a2a/conversations/[id]/keys - Get encryption keys for a conversation
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

    // Verify user is a participant in this conversation
    const { data: conversation, error: convError } = await supabase
      .from('a2a_conversations')
      .select(`
        id,
        initiator_credential_id,
        recipient_credential_id,
        encryption_enabled
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user owns either credential
    const { data: userCredentials } = await supabase
      .from('credentials')
      .select('id')
      .or(`issuer_id.eq.${user.id}`);

    const credIds = (userCredentials || []).map(c => c.id);
    const isParticipant = credIds.includes(conversation.initiator_credential_id) ||
                          credIds.includes(conversation.recipient_credential_id);

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get encryption keys for this conversation
    const serviceSupabase = getServiceSupabase();
    const { data: keys, error: keysError } = await serviceSupabase
      .from('a2a_encryption_keys')
      .select('id, credential_id, public_key, key_algorithm, created_at, expires_at')
      .eq('conversation_id', conversationId);

    if (keysError) {
      console.error('Failed to fetch encryption keys:', keysError);
      return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
    }

    return NextResponse.json({
      conversation_id: conversationId,
      encryption_enabled: conversation.encryption_enabled,
      keys: keys || [],
    });
  } catch (error) {
    console.error('Get encryption keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/a2a/conversations/[id]/keys - Register encryption key for a conversation
 */
export async function POST(
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
    const { credential_id, public_key, key_algorithm = 'ecdh-p256' } = body;

    // Validate required fields
    if (!credential_id || !public_key) {
      return NextResponse.json(
        { error: 'Missing required fields: credential_id, public_key' },
        { status: 400 }
      );
    }

    // Validate public key is base64
    if (!isValidBase64(public_key)) {
      return NextResponse.json(
        { error: 'Invalid public_key: must be base64 encoded' },
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
      // Check team membership
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('issuer_id', credential.issuer_id)
        .eq('user_id', user.id)
        .single();

      if (!teamMember) {
        return NextResponse.json({ error: 'You do not own this credential' }, { status: 403 });
      }
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

    const isParticipant = conversation.initiator_credential_id === credential_id ||
                          conversation.recipient_credential_id === credential_id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Credential is not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Upsert encryption key
    const { data: key, error: keyError } = await serviceSupabase
      .from('a2a_encryption_keys')
      .upsert({
        conversation_id: conversationId,
        credential_id,
        public_key,
        key_algorithm,
      }, {
        onConflict: 'conversation_id,credential_id',
      })
      .select()
      .single();

    if (keyError) {
      console.error('Failed to save encryption key:', keyError);
      return NextResponse.json({ error: 'Failed to save key' }, { status: 500 });
    }

    // Enable encryption on the conversation if both keys are present
    const { data: allKeys } = await serviceSupabase
      .from('a2a_encryption_keys')
      .select('credential_id')
      .eq('conversation_id', conversationId);

    const hasInitiatorKey = allKeys?.some(k => k.credential_id === conversation.initiator_credential_id);
    const hasRecipientKey = allKeys?.some(k => k.credential_id === conversation.recipient_credential_id);

    if (hasInitiatorKey && hasRecipientKey) {
      await serviceSupabase
        .from('a2a_conversations')
        .update({ encryption_enabled: true })
        .eq('id', conversationId);
    }

    return NextResponse.json({
      key,
      message: 'Encryption key registered',
      encryption_ready: hasInitiatorKey && hasRecipientKey,
    });
  } catch (error) {
    console.error('Register encryption key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/a2a/conversations/[id]/keys - Remove encryption key
 */
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
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
      return NextResponse.json({ error: 'You do not own this credential' }, { status: 403 });
    }

    const serviceSupabase = getServiceSupabase();

    // Delete the key
    await serviceSupabase
      .from('a2a_encryption_keys')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('credential_id', credentialId);

    // Disable encryption on conversation
    await serviceSupabase
      .from('a2a_conversations')
      .update({ encryption_enabled: false })
      .eq('id', conversationId);

    return NextResponse.json({ message: 'Encryption key removed' });
  } catch (error) {
    console.error('Delete encryption key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
