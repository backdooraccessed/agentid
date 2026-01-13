import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabase;
}

/**
 * GET /api/badge/[id] - Get verification badge for a credential
 * Query params:
 *   - format: svg | json (default: svg)
 *   - style: flat | plastic (default: flat)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'svg';
  const style = searchParams.get('style') || 'flat';

  // Fetch credential
  const { data, error } = await getSupabase()
    .from('credentials')
    .select(`
      id,
      agent_id,
      agent_name,
      status,
      valid_until,
      issuers!inner(name, is_verified)
    `)
    .eq('id', id)
    .single();

  const credential = data as {
    id: string;
    agent_id: string;
    agent_name: string;
    status: string;
    valid_until: string;
    issuers: { name: string; is_verified: boolean };
  } | null;

  if (error || !credential) {
    if (format === 'json') {
      return NextResponse.json({ valid: false, error: 'Credential not found' });
    }
    return new NextResponse(generateBadgeSvg('AgentID', 'Not Found', '#999', '#666', style), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  // Check validity
  const now = new Date();
  const validUntil = new Date(credential.valid_until);
  const isExpired = now >= validUntil;
  const isRevoked = credential.status === 'revoked';
  const isValid = credential.status === 'active' && !isExpired;

  if (format === 'json') {
    return NextResponse.json({
      valid: isValid,
      credential_id: credential.id,
      agent_id: credential.agent_id,
      agent_name: credential.agent_name,
      status: isRevoked ? 'revoked' : isExpired ? 'expired' : credential.status,
      issuer: {
        name: credential.issuers.name,
        verified: credential.issuers.is_verified,
      },
      valid_until: credential.valid_until,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  // Generate SVG badge
  let statusText: string;
  let statusColor: string;
  let labelColor: string;

  if (isValid) {
    statusText = 'Verified';
    statusColor = '#4CAF50';
    labelColor = '#555';
  } else if (isRevoked) {
    statusText = 'Revoked';
    statusColor = '#f44336';
    labelColor = '#555';
  } else if (isExpired) {
    statusText = 'Expired';
    statusColor = '#ff9800';
    labelColor = '#555';
  } else {
    statusText = 'Invalid';
    statusColor = '#999';
    labelColor = '#555';
  }

  const svg = generateBadgeSvg('AgentID', statusText, labelColor, statusColor, style);

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

function generateBadgeSvg(
  label: string,
  status: string,
  labelColor: string,
  statusColor: string,
  style: string
): string {
  const labelWidth = label.length * 7 + 10;
  const statusWidth = status.length * 7 + 10;
  const totalWidth = labelWidth + statusWidth;
  const height = style === 'plastic' ? 20 : 20;

  if (style === 'plastic') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
      <linearGradient id="a" x2="0" y2="100%">
        <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
        <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
        <stop offset=".9" stop-color="#000" stop-opacity=".3"/>
        <stop offset="1" stop-color="#000" stop-opacity=".5"/>
      </linearGradient>
      <rect rx="4" width="${totalWidth}" height="${height}" fill="${labelColor}"/>
      <rect rx="4" x="${labelWidth}" width="${statusWidth}" height="${height}" fill="${statusColor}"/>
      <path fill="${statusColor}" d="M${labelWidth} 0h4v${height}h-4z"/>
      <rect rx="4" width="${totalWidth}" height="${height}" fill="url(#a)"/>
      <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="${labelWidth / 2}" y="14">${label}</text>
        <text x="${labelWidth + statusWidth / 2}" y="14">${status}</text>
      </g>
    </svg>`;
  }

  // Flat style (default)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
    <rect rx="3" width="${totalWidth}" height="${height}" fill="${labelColor}"/>
    <rect rx="3" x="${labelWidth}" width="${statusWidth}" height="${height}" fill="${statusColor}"/>
    <path fill="${statusColor}" d="M${labelWidth} 0h4v${height}h-4z"/>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
      <text x="${labelWidth / 2}" y="14">${label}</text>
      <text x="${labelWidth + statusWidth / 2}" y="14">${status}</text>
    </g>
  </svg>`;
}
