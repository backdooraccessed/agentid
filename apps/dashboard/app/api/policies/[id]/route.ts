import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';
import { z } from 'zod';

// Validation schema for updating policies
const updatePolicySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z
    .array(
      z.union([
        z.string(),
        z.object({
          resource: z.string(),
          actions: z.array(z.string()),
          conditions: z
            .object({
              valid_hours: z
                .object({
                  start: z.string(),
                  end: z.string(),
                  timezone: z.string().optional(),
                })
                .optional(),
              valid_days: z.array(z.string()).optional(),
              max_requests_per_minute: z.number().optional(),
              max_requests_per_day: z.number().optional(),
              max_transaction_amount: z.number().optional(),
              daily_spend_limit: z.number().optional(),
              allowed_regions: z.array(z.string()).optional(),
              requires_approval: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
    )
    .optional(),
  is_active: z.boolean().optional(),
  change_reason: z.string().max(500).optional(),
});

/**
 * GET /api/policies/[id] - Get a specific policy with version history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!auth.issuerId) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    // Get policy
    const { data: policy, error } = await supabase
      .from('permission_policies')
      .select('*')
      .eq('id', id)
      .eq('issuer_id', auth.issuerId)
      .single();

    if (error || !policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    // Get version history
    const { data: versions } = await supabase
      .from('policy_versions')
      .select('*')
      .eq('policy_id', id)
      .order('version', { ascending: false })
      .limit(10);

    // Get credentials using this policy
    const { data: credentials, count } = await supabase
      .from('credentials')
      .select('id, agent_id, agent_name, status', { count: 'exact' })
      .eq('permission_policy_id', id)
      .limit(10);

    return NextResponse.json({
      policy,
      versions: versions || [],
      credentials: {
        items: credentials || [],
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Get policy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/policies/[id] - Update a policy (triggers live permission update)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!auth.issuerId) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    if (auth.apiKeyInfo && !checkScope(auth, ApiKeyScopes.CREDENTIALS_WRITE)) {
      return NextResponse.json(
        { error: 'API key lacks credentials:write scope' },
        { status: 403 }
      );
    }

    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    // Verify policy ownership
    const { data: existingPolicy, error: fetchError } = await supabase
      .from('permission_policies')
      .select('*')
      .eq('id', id)
      .eq('issuer_id', auth.issuerId)
      .single();

    if (fetchError || !existingPolicy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = updatePolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Count affected credentials for response
    const { count: affectedCount } = await supabase
      .from('credentials')
      .select('id', { count: 'exact', head: true })
      .eq('permission_policy_id', id)
      .eq('status', 'active');

    // Build update object
    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active;

    // Handle permissions update (triggers version increment and broadcast)
    if (parsed.data.permissions !== undefined) {
      updates.permissions = parsed.data.permissions;
      updates.version = existingPolicy.version + 1;

      // Record version history
      await supabase.from('policy_versions').insert({
        policy_id: id,
        version: existingPolicy.version + 1,
        permissions: parsed.data.permissions,
        changed_by: auth.userId,
        change_reason: parsed.data.change_reason,
        change_type: 'updated',
      });
    }

    // Update policy
    const { data: policy, error: updateError } = await supabase
      .from('permission_policies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update policy error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update policy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      policy,
      affected_credentials: affectedCount || 0,
      // Permissions are updated instantly for all credentials using this policy
      live_update: parsed.data.permissions !== undefined,
    });
  } catch (error) {
    console.error('Update policy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/policies/[id] - Delete a policy (removes from all credentials)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!auth.issuerId) {
      return NextResponse.json(
        { error: 'Issuer profile not found' },
        { status: 404 }
      );
    }

    if (auth.apiKeyInfo && !checkScope(auth, ApiKeyScopes.CREDENTIALS_WRITE)) {
      return NextResponse.json(
        { error: 'API key lacks credentials:write scope' },
        { status: 403 }
      );
    }

    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    // Verify policy ownership and get affected credential count
    const { data: policy, error: fetchError } = await supabase
      .from('permission_policies')
      .select('*')
      .eq('id', id)
      .eq('issuer_id', auth.issuerId)
      .single();

    if (fetchError || !policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    // Count credentials that will be affected
    const { count: affectedCount } = await supabase
      .from('credentials')
      .select('id', { count: 'exact', head: true })
      .eq('permission_policy_id', id);

    // Delete policy (CASCADE will remove versions, policy_id on credentials becomes NULL)
    const { error: deleteError } = await supabase
      .from('permission_policies')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete policy error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete policy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted_policy_id: id,
      affected_credentials: affectedCount || 0,
      message:
        affectedCount && affectedCount > 0
          ? `Policy deleted. ${affectedCount} credential(s) will now use their static permissions.`
          : 'Policy deleted.',
    });
  } catch (error) {
    console.error('Delete policy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
