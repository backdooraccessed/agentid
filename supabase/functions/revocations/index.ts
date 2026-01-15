// AgentID - Revocations Edge Function
// Handles credential revocation and provides revocation stream access

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface RevocationEvent {
  credential_id: string;
  revoked_at: string;
  reason?: string;
  sequence_number?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.replace('/revocations', '');

    // Check for WebSocket upgrade
    if (req.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      return handleWebSocket(req, supabase);
    }

    // HTTP endpoints
    if (req.method === 'GET') {
      // GET /revocations - Poll for recent revocations
      return await handleGetRevocations(req, supabase);
    }

    if (req.method === 'POST') {
      // POST /revocations - Revoke a credential
      return await handleRevoke(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle GET /revocations - Poll for recent revocations
 */
async function handleGetRevocations(
  req: Request,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const url = new URL(req.url);
  const since = parseInt(url.searchParams.get('since') || '0', 10);
  const credentialIdsParam = url.searchParams.get('credential_ids');
  const credentialIds = credentialIdsParam ? credentialIdsParam.split(',') : null;
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);

  // Call the get_revocations_since function
  const { data, error } = await supabase.rpc('get_revocations_since', {
    p_since_ms: since,
    p_credential_ids: credentialIds,
    p_limit: Math.min(limit, 1000), // Cap at 1000
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      revocations: data || [],
      timestamp: Date.now(),
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle POST /revocations - Revoke a credential
 */
async function handleRevoke(
  req: Request,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  // Check authorization
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get user from token
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Parse request body
  const body = await req.json();
  const { credential_id, reason } = body;

  if (!credential_id) {
    return new Response(
      JSON.stringify({ error: 'credential_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Call the revoke_credential function
  const { data, error } = await supabase.rpc('revoke_credential', {
    p_credential_id: credential_id,
    p_reason: reason,
    p_user_id: user.id,
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const result = data?.[0];

  if (!result?.success) {
    return new Response(
      JSON.stringify({ error: result?.message || 'Revocation failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: result.message,
      revocation_id: result.revocation_id,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Handle WebSocket connection for real-time revocations
 */
function handleWebSocket(
  req: Request,
  supabase: ReturnType<typeof createClient>
): Response {
  const url = new URL(req.url);
  const credentialIdsParam = url.searchParams.get('credential_ids');
  const credentialIds = credentialIdsParam ? new Set(credentialIdsParam.split(',')) : null;

  const { socket, response } = Deno.upgradeWebSocket(req);

  // Track subscribed credential IDs
  let subscribedIds = credentialIds;

  // Set up Supabase Realtime subscription
  const channel = supabase
    .channel('revocations-broadcast')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'revocations_stream',
      },
      (payload) => {
        const event = payload.new as RevocationEvent;

        // Filter by subscribed credentials if specified
        if (subscribedIds && !subscribedIds.has(event.credential_id)) {
          return;
        }

        // Send to client
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'revocation',
            data: {
              credential_id: event.credential_id,
              revoked_at: event.revoked_at,
              reason: event.reason,
            },
          }));
        }
      }
    )
    .subscribe();

  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'subscribe':
          // Add credential ID to filter
          if (message.credential_id) {
            if (!subscribedIds) {
              subscribedIds = new Set();
            }
            subscribedIds.add(message.credential_id);
            socket.send(JSON.stringify({ type: 'subscribed', credential_id: message.credential_id }));
          }
          break;

        case 'unsubscribe':
          // Remove credential ID from filter
          if (message.credential_id && subscribedIds) {
            subscribedIds.delete(message.credential_id);
            socket.send(JSON.stringify({ type: 'unsubscribed', credential_id: message.credential_id }));
          }
          break;

        case 'ping':
          socket.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'pong':
          // Response to our ping, no action needed
          break;

        default:
          socket.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
      }
    } catch (err) {
      socket.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
    }
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    channel.unsubscribe();
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    channel.unsubscribe();
  };

  // Set up keepalive ping
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }));
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);

  return response;
}
