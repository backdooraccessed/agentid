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

// GET /api/a2a/conversations/[id]/messages - List messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const after = searchParams.get('after'); // Message ID to fetch messages after

    // Verify user is participant in conversation
    const { data: conversation, error: convError } = await supabase
      .from('a2a_conversations')
      .select('id')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('a2a_messages')
      .select(`
        *,
        sender:credentials!sender_credential_id(
          id,
          agent_name,
          issuer:issuers(display_name)
        )
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (after) {
      // Get the timestamp of the 'after' message
      const { data: afterMessage } = await supabase
        .from('a2a_messages')
        .select('created_at')
        .eq('id', after)
        .single();

      if (afterMessage) {
        query = query.gt('created_at', afterMessage.created_at);
      }
    } else {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Failed to fetch messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({
      messages: messages || [],
      conversation_id: id,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/a2a/conversations/[id]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sender_credential_id,
      message_type,
      content,
      signature,
      signature_timestamp,
      nonce,
      reply_to_id,
    } = body;

    // Validate required fields
    if (!sender_credential_id || !content || !signature || !signature_timestamp || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields: sender_credential_id, content, signature, signature_timestamp, nonce' },
        { status: 400 }
      );
    }

    // Verify message type
    const validTypes = ['text', 'request', 'response', 'authorization', 'data', 'error'];
    if (message_type && !validTypes.includes(message_type)) {
      return NextResponse.json(
        { error: `Invalid message_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify signature timestamp is recent (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - signature_timestamp) > 300) {
      return NextResponse.json(
        { error: 'Signature timestamp too old or too far in the future' },
        { status: 400 }
      );
    }

    // Verify the user owns the sender credential
    const { data: senderCred, error: credError } = await supabase
      .from('credentials')
      .select('id, issuer_id')
      .eq('id', sender_credential_id)
      .single();

    if (credError || !senderCred) {
      return NextResponse.json({ error: 'Sender credential not found' }, { status: 404 });
    }

    if (senderCred.issuer_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this credential' }, { status: 403 });
    }

    // Send message via function
    const serviceSupabase = getServiceSupabase();
    const { data: messageId, error } = await serviceSupabase
      .rpc('send_a2a_message', {
        p_conversation_id: id,
        p_sender_id: sender_credential_id,
        p_message_type: message_type || 'text',
        p_content: content,
        p_signature: signature,
        p_signature_timestamp: signature_timestamp,
        p_nonce: nonce,
        p_reply_to_id: reply_to_id || null,
      });

    if (error) {
      console.error('Failed to send message:', error);
      if (error.message.includes('Replay detected')) {
        return NextResponse.json({ error: 'Replay detected: nonce already used' }, { status: 400 });
      }
      if (error.message.includes('not a participant')) {
        return NextResponse.json({ error: 'Sender is not a participant in this conversation' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({
      message_id: messageId,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
