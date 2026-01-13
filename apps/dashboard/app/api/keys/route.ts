import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiKey, listApiKeys, ApiKeyScopes, ApiKeyScope } from '@/lib/api-keys';
import { z } from 'zod';

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scopes: z.array(z.enum([
    ApiKeyScopes.CREDENTIALS_READ,
    ApiKeyScopes.CREDENTIALS_WRITE,
    ApiKeyScopes.WEBHOOKS_READ,
    ApiKeyScopes.WEBHOOKS_WRITE,
    ApiKeyScopes.REPUTATION_READ,
  ])).min(1),
  expires_in_days: z.number().min(1).max(365).optional(),
});

/**
 * GET /api/keys - List API keys
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer profile
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    const keys = await listApiKeys(issuer.id);

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keys - Create API key
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get issuer profile
    const { data: issuer } = await supabase
      .from('issuers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!issuer) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    // Parse request
    const body = await request.json();
    const parsed = createKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, description, scopes, expires_in_days } = parsed.data;

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (expires_in_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
    }

    // Create key
    const result = await createApiKey(
      issuer.id,
      name,
      description || null,
      scopes as ApiKeyScope[],
      expiresAt
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: result.id,
      key: result.key,
      message: 'API key created. Save this key - it will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
