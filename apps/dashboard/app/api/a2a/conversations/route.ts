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

// GET /api/a2a/conversations - List conversations for a credential
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const credentialId = searchParams.get('credential_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('v_a2a_conversations')
      .select('*');

    if (credentialId) {
      query = query.or(`initiator_credential_id.eq.${credentialId},recipient_credential_id.eq.${credentialId}`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: conversations, error, count } = await query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({
      conversations: conversations || [],
      total: count || conversations?.length || 0,
    });
  } catch (error) {
    console.error('Conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/a2a/conversations - Start a new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { initiator_credential_id, recipient_credential_id, subject } = body;

    if (!initiator_credential_id || !recipient_credential_id) {
      return NextResponse.json(
        { error: 'Both initiator_credential_id and recipient_credential_id are required' },
        { status: 400 }
      );
    }

    // Verify the user owns the initiator credential
    const { data: initiatorCred, error: credError } = await supabase
      .from('credentials')
      .select('id, issuer_id')
      .eq('id', initiator_credential_id)
      .single();

    if (credError || !initiatorCred) {
      return NextResponse.json({ error: 'Initiator credential not found' }, { status: 404 });
    }

    if (initiatorCred.issuer_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this credential' }, { status: 403 });
    }

    // Verify recipient credential exists and is active
    const serviceSupabase = getServiceSupabase();
    const { data: recipientCred, error: recipientError } = await serviceSupabase
      .from('credentials')
      .select('id, status')
      .eq('id', recipient_credential_id)
      .single();

    if (recipientError || !recipientCred) {
      return NextResponse.json({ error: 'Recipient credential not found' }, { status: 404 });
    }

    if (recipientCred.status !== 'active') {
      return NextResponse.json({ error: 'Recipient credential is not active' }, { status: 400 });
    }

    // Start conversation
    const { data, error } = await serviceSupabase
      .rpc('start_a2a_conversation', {
        p_initiator_id: initiator_credential_id,
        p_recipient_id: recipient_credential_id,
        p_subject: subject || null,
      });

    if (error) {
      console.error('Failed to start conversation:', error);
      return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 });
    }

    return NextResponse.json({
      conversation_id: data,
      message: 'Conversation started successfully',
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
