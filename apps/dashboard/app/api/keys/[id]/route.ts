import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revokeApiKey, deleteApiKey, getApiKeyUsageStats } from '@/lib/api-keys';

/**
 * GET /api/keys/[id] - Get API key details with usage stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get API key
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        name,
        description,
        key_prefix,
        scopes,
        is_active,
        last_used_at,
        usage_count,
        expires_at,
        created_at
      `)
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .single();

    if (error || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Get usage stats
    const usage = await getApiKeyUsageStats(id, 7);

    return NextResponse.json({
      key: {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        keyPrefix: apiKey.key_prefix,
        scopes: apiKey.scopes,
        isActive: apiKey.is_active,
        lastUsedAt: apiKey.last_used_at,
        usageCount: apiKey.usage_count,
        expiresAt: apiKey.expires_at,
        createdAt: apiKey.created_at,
      },
      usage,
    });
  } catch (error) {
    console.error('Get API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/keys/[id] - Update API key (revoke/reactivate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { is_active, name, description } = body;

    // Build update object
    const updates: Record<string, unknown> = {};
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (typeof name === 'string') updates.name = name;
    if (typeof description === 'string') updates.description = description;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .eq('issuer_id', issuer.id)
      .select('id, name, is_active')
      .single();

    if (error || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ key: apiKey });
  } catch (error) {
    console.error('Update API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keys/[id] - Delete API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const success = await deleteApiKey(id, issuer.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
