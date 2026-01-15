import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { authenticateRequest, checkScope } from '@/lib/auth';
import { ApiKeyScopes } from '@/lib/api-keys';
import { z } from 'zod';

// Validation schema for creating/updating policies
const policySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(
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
  ),
  change_reason: z.string().max(500).optional(),
});

/**
 * GET /api/policies - List all policies for the issuer
 */
export async function GET(request: NextRequest) {
  try {
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

    // Check scope for API key auth
    if (auth.apiKeyInfo && !checkScope(auth, ApiKeyScopes.CREDENTIALS_READ)) {
      return NextResponse.json(
        { error: 'API key lacks credentials:read scope' },
        { status: 403 }
      );
    }

    const supabase = auth.apiKeyInfo
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : await createClient();

    // Get policies with usage stats
    const { data: policies, error } = await supabase
      .from('v_policy_usage')
      .select('*')
      .eq('issuer_id', auth.issuerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch policies error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch policies' },
        { status: 500 }
      );
    }

    return NextResponse.json({ policies: policies || [] });
  } catch (error) {
    console.error('Get policies error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/policies - Create a new policy
 */
export async function POST(request: NextRequest) {
  try {
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

    // Check scope for API key auth
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

    // Parse and validate request body
    const body = await request.json();
    const parsed = policySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Use upsert function to create or update
    const { data: result, error } = await supabase.rpc('upsert_permission_policy', {
      p_issuer_id: auth.issuerId,
      p_name: parsed.data.name,
      p_permissions: parsed.data.permissions,
      p_description: parsed.data.description,
      p_user_id: auth.userId,
      p_change_reason: parsed.data.change_reason,
    });

    if (error) {
      console.error('Create policy error:', error);
      return NextResponse.json(
        { error: 'Failed to create policy' },
        { status: 500 }
      );
    }

    const policyResult = result?.[0];

    // Fetch the created policy
    const { data: policy } = await supabase
      .from('permission_policies')
      .select('*')
      .eq('id', policyResult.policy_id)
      .single();

    return NextResponse.json(
      {
        policy,
        created: policyResult.is_new,
        version: policyResult.version,
      },
      { status: policyResult.is_new ? 201 : 200 }
    );
  } catch (error) {
    console.error('Create policy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
