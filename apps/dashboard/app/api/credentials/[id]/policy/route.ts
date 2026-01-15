import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';
import { z } from 'zod';

const assignPolicySchema = z.object({
  policy_id: z.string().uuid(),
});

/**
 * PUT /api/credentials/[id]/policy - Assign a policy to a credential
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

    // Parse request body
    const body = await request.json();
    const parsed = assignPolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Use database function to assign policy
    const { data: result, error } = await supabase.rpc('assign_policy_to_credential', {
      p_credential_id: id,
      p_policy_id: parsed.data.policy_id,
      p_user_id: auth.userId,
    });

    if (error) {
      console.error('Assign policy error:', error);
      return NextResponse.json(
        { error: 'Failed to assign policy' },
        { status: 500 }
      );
    }

    const assignResult = result?.[0];

    if (!assignResult?.success) {
      return NextResponse.json(
        { error: assignResult?.message || 'Failed to assign policy' },
        { status: 400 }
      );
    }

    // Fetch updated credential with policy info
    const { data: credential } = await supabase
      .from('v_credentials_with_permissions')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Policy assigned successfully',
      credential: credential
        ? {
            id: credential.id,
            agent_id: credential.agent_id,
            policy_id: credential.permission_policy_id,
            policy_name: credential.policy_name,
            policy_version: credential.policy_version,
            effective_permissions: credential.effective_permissions,
          }
        : null,
      // Permissions now come from the policy and update automatically
      live_permissions: true,
    });
  } catch (error) {
    console.error('Assign policy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/credentials/[id]/policy - Remove policy from a credential
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

    // Use database function to remove policy
    const { data: result, error } = await supabase.rpc('remove_policy_from_credential', {
      p_credential_id: id,
      p_user_id: auth.userId,
    });

    if (error) {
      console.error('Remove policy error:', error);
      return NextResponse.json(
        { error: 'Failed to remove policy' },
        { status: 500 }
      );
    }

    const removeResult = result?.[0];

    if (!removeResult?.success) {
      return NextResponse.json(
        { error: removeResult?.message || 'Failed to remove policy' },
        { status: 400 }
      );
    }

    // Fetch updated credential
    const { data: credential } = await supabase
      .from('credentials')
      .select('id, agent_id, permissions')
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Policy removed. Credential now uses static permissions.',
      credential: credential
        ? {
            id: credential.id,
            agent_id: credential.agent_id,
            permissions: credential.permissions,
          }
        : null,
      // Permissions are now static (from credential)
      live_permissions: false,
    });
  } catch (error) {
    console.error('Remove policy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
