// AgentID - Sign Credential Edge Function
// Handles Ed25519 key generation and credential signing

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Ed25519 implementation using Web Crypto + noble-ed25519 approach
// We use the native crypto.subtle for key derivation and a simplified Ed25519 for signing

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, payload, issuer_id, user_id } = await req.json();

    // Get the master signing key from environment
    const MASTER_KEY = Deno.env.get('SIGNING_KEY_SEED');
    if (!MASTER_KEY) {
      throw new Error('SIGNING_KEY_SEED not configured');
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'generate_keys') {
      // Generate a deterministic key pair for this user
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id required for key generation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { publicKey } = await generateKeyPair(MASTER_KEY, user_id);

      return new Response(
        JSON.stringify({ public_key: publicKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default action: sign credential
    if (!payload || !issuer_id) {
      return new Response(
        JSON.stringify({ error: 'Missing payload or issuer_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get issuer's user_id to derive their signing key
    const { data: issuer, error } = await supabase
      .from('issuers')
      .select('user_id')
      .eq('id', issuer_id)
      .single();

    if (error || !issuer) {
      return new Response(
        JSON.stringify({ error: 'Issuer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sign the payload
    const signature = await signPayload(MASTER_KEY, issuer.user_id, payload);

    return new Response(
      JSON.stringify({ signature }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =============================================================================
// CRYPTOGRAPHIC FUNCTIONS
// =============================================================================

/**
 * Derive a 32-byte key from master key + identifier using HKDF
 */
async function deriveKey(masterKey: string, identifier: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const masterBytes = encoder.encode(masterKey);
  const salt = encoder.encode(identifier);
  const info = encoder.encode('agentid-signing-key-v1');

  // Import master key for HKDF
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    masterBytes,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Derive 32 bytes (256 bits) for Ed25519 seed
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: info,
    },
    keyMaterial,
    256
  );

  return new Uint8Array(derivedBits);
}

/**
 * Generate Ed25519 key pair from seed
 * Using a simplified approach with Web Crypto for the demo
 * In production, consider using @noble/ed25519 for proper Ed25519
 */
async function generateKeyPair(
  masterKey: string,
  userId: string
): Promise<{ publicKey: string; privateKey: Uint8Array }> {
  // Derive seed from master + user_id
  const seed = await deriveKey(masterKey, userId);

  // For Ed25519, we use the seed to derive a key pair
  // This is a simplified implementation - in production use @noble/ed25519
  // Here we use ECDSA P-256 as a placeholder that works with Web Crypto
  // The actual Ed25519 implementation would require importing noble-ed25519

  // Generate deterministic key by hashing seed
  const hashBuffer = await crypto.subtle.digest('SHA-256', seed);
  const hashArray = new Uint8Array(hashBuffer);

  // For demo purposes, we'll base64 encode the hash as "public key"
  // In production, this should use proper Ed25519 key derivation
  const publicKey = base64Encode(hashArray);

  return { publicKey, privateKey: seed };
}

/**
 * Sign a payload with the derived private key
 */
async function signPayload(
  masterKey: string,
  userId: string,
  payload: unknown
): Promise<string> {
  // Derive the private key seed
  const seed = await deriveKey(masterKey, userId);

  // Serialize payload
  const message = new TextEncoder().encode(JSON.stringify(payload));

  // Create signature using HMAC-SHA256 as a simplified approach
  // In production, use proper Ed25519 signing with @noble/ed25519
  const key = await crypto.subtle.importKey(
    'raw',
    seed,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, message);
  const signature = base64Encode(new Uint8Array(signatureBuffer));

  return signature;
}

/**
 * Base64 encode bytes
 */
function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
