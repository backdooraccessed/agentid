// Migration endpoint to re-sign credentials with Ed25519
// This should be run once after deploying the new signing algorithm
// DELETE THIS FILE after migration is complete

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Only allow in development or with admin key
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = {
    issuersUpdated: 0,
    credentialsResigned: 0,
    errors: [] as string[],
  };

  try {
    // 1. Get all issuers
    const { data: issuers, error: issuerError } = await supabase
      .from('issuers')
      .select('*');

    if (issuerError || !issuers) {
      return NextResponse.json(
        { error: 'Failed to fetch issuers', details: issuerError },
        { status: 500 }
      );
    }

    // 2. Update each issuer's public key to real Ed25519
    for (const issuer of issuers) {
      try {
        // Generate new Ed25519 public key
        const { data: keyPair, error: keyError } = await supabase.functions.invoke(
          'sign-credential',
          {
            body: {
              action: 'generate_keys',
              user_id: issuer.user_id,
            },
          }
        );

        if (keyError || !keyPair?.public_key) {
          results.errors.push(`Failed to generate key for issuer ${issuer.id}: ${keyError?.message}`);
          continue;
        }

        // Update issuer with new public key
        const { error: updateError } = await supabase
          .from('issuers')
          .update({ public_key: keyPair.public_key })
          .eq('id', issuer.id);

        if (updateError) {
          results.errors.push(`Failed to update issuer ${issuer.id}: ${updateError.message}`);
          continue;
        }

        results.issuersUpdated++;

        // 3. Re-sign all credentials for this issuer
        const { data: credentials, error: credError } = await supabase
          .from('credentials')
          .select('*')
          .eq('issuer_id', issuer.id);

        if (credError || !credentials) {
          results.errors.push(`Failed to fetch credentials for issuer ${issuer.id}`);
          continue;
        }

        for (const credential of credentials) {
          try {
            // Build the credential payload (without old signature)
            const credentialPayload = {
              credential_id: credential.id,
              agent_id: credential.agent_id,
              agent_name: credential.agent_name,
              agent_type: credential.agent_type,
              issuer: {
                issuer_id: issuer.id,
                issuer_type: issuer.issuer_type,
                issuer_verified: issuer.is_verified,
                name: issuer.name,
              },
              permissions: credential.permissions,
              constraints: {
                valid_from: credential.valid_from,
                valid_until: credential.valid_until,
                geographic_restrictions: credential.geographic_restrictions || [],
                allowed_services: credential.allowed_services || [],
              },
              issued_at: credential.created_at,
            };

            // Sign with new Ed25519
            const { data: signResult, error: signError } = await supabase.functions.invoke(
              'sign-credential',
              {
                body: {
                  payload: credentialPayload,
                  issuer_id: issuer.id,
                },
              }
            );

            if (signError || !signResult?.signature) {
              results.errors.push(`Failed to sign credential ${credential.id}: ${signError?.message}`);
              continue;
            }

            // Update credential with new signature
            const signedPayload = {
              ...credentialPayload,
              signature: signResult.signature,
            };

            const { error: credUpdateError } = await supabase
              .from('credentials')
              .update({
                signature: signResult.signature,
                credential_payload: signedPayload,
                key_id: issuer.key_id,
              })
              .eq('id', credential.id);

            if (credUpdateError) {
              results.errors.push(`Failed to update credential ${credential.id}: ${credUpdateError.message}`);
              continue;
            }

            results.credentialsResigned++;
          } catch (err) {
            results.errors.push(`Error processing credential ${credential.id}: ${err}`);
          }
        }
      } catch (err) {
        results.errors.push(`Error processing issuer ${issuer.id}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
