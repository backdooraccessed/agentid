import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public Supabase client for verification
function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Service client for internal operations
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/a2a/authorizations/check - Check if agent is authorized for an action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requester_credential_id, grantor_credential_id, permission } = body;

    if (!requester_credential_id || !grantor_credential_id || !permission) {
      return NextResponse.json(
        { error: 'Missing required fields: requester_credential_id, grantor_credential_id, permission' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check authorization using the function
    const { data, error } = await supabase
      .rpc('check_a2a_authorization', {
        p_requester_id: requester_credential_id,
        p_grantor_id: grantor_credential_id,
        p_permission: permission,
      });

    if (error) {
      console.error('Authorization check failed:', error);
      return NextResponse.json({ error: 'Authorization check failed' }, { status: 500 });
    }

    const result = data?.[0];

    if (!result || !result.authorized) {
      return NextResponse.json({
        authorized: false,
        message: 'No valid authorization found',
      });
    }

    return NextResponse.json({
      authorized: true,
      authorization_id: result.authorization_id,
      constraints: result.constraints,
      valid_until: result.valid_until,
    });
  } catch (error) {
    console.error('Check authorization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
