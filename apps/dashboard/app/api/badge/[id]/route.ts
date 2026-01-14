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
 *   - format: svg | json | html (default: svg)
 *   - style: flat | flat-square | plastic | modern (default: modern)
 *   - theme: light | dark (default: light)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'svg';
  const style = searchParams.get('style') || 'modern';
  const theme = searchParams.get('theme') || 'light';

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
    if (format === 'html') {
      return new NextResponse(generateBadgeHtml('Not Found', 'error', theme, id), {
        headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=60' },
      });
    }
    return new NextResponse(generateBadgeSvg('AgentID', 'Not Found', 'error', style, theme), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
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
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  }

  // Determine status
  let statusText: string;
  let statusType: 'verified' | 'revoked' | 'expired' | 'error';

  if (isValid) {
    statusText = 'Verified';
    statusType = 'verified';
  } else if (isRevoked) {
    statusText = 'Revoked';
    statusType = 'revoked';
  } else if (isExpired) {
    statusText = 'Expired';
    statusType = 'expired';
  } else {
    statusText = 'Invalid';
    statusType = 'error';
  }

  if (format === 'html') {
    return new NextResponse(
      generateBadgeHtml(statusText, statusType, theme, id, credential.agent_name),
      { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=60' } }
    );
  }

  const svg = generateBadgeSvg('AgentID', statusText, statusType, style, theme);

  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
  });
}

function getStatusColors(status: 'verified' | 'revoked' | 'expired' | 'error', theme: string) {
  const colors = {
    verified: { bg: '#10B981', text: '#fff' },
    revoked: { bg: '#EF4444', text: '#fff' },
    expired: { bg: '#F59E0B', text: '#fff' },
    error: { bg: '#6B7280', text: '#fff' },
  };

  const labelColors = theme === 'dark'
    ? { bg: '#374151', text: '#fff' }
    : { bg: '#4F46E5', text: '#fff' };

  return { status: colors[status], label: labelColors };
}

function generateBadgeSvg(
  label: string,
  status: string,
  statusType: 'verified' | 'revoked' | 'expired' | 'error',
  style: string,
  theme: string
): string {
  const colors = getStatusColors(statusType, theme);

  if (style === 'modern') {
    return generateModernBadge(label, status, colors);
  }

  const labelWidth = label.length * 7 + 14;
  const statusWidth = status.length * 7 + 14;
  const totalWidth = labelWidth + statusWidth;
  const height = 22;
  const radius = style === 'flat-square' ? 0 : style === 'plastic' ? 4 : 3;

  if (style === 'plastic') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
      <linearGradient id="a" x2="0" y2="100%">
        <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
        <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
        <stop offset=".9" stop-color="#000" stop-opacity=".3"/>
        <stop offset="1" stop-color="#000" stop-opacity=".5"/>
      </linearGradient>
      <rect rx="${radius}" width="${totalWidth}" height="${height}" fill="${colors.label.bg}"/>
      <rect rx="${radius}" x="${labelWidth}" width="${statusWidth}" height="${height}" fill="${colors.status.bg}"/>
      <path fill="${colors.status.bg}" d="M${labelWidth} 0h4v${height}h-4z"/>
      <rect rx="${radius}" width="${totalWidth}" height="${height}" fill="url(#a)"/>
      <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11" font-weight="600">
        <text x="${labelWidth / 2}" y="15">${label}</text>
        <text x="${labelWidth + statusWidth / 2}" y="15">${status}</text>
      </g>
    </svg>`;
  }

  // Flat / Flat-square style
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
    <rect rx="${radius}" width="${totalWidth}" height="${height}" fill="${colors.label.bg}"/>
    <rect rx="${radius}" x="${labelWidth}" width="${statusWidth}" height="${height}" fill="${colors.status.bg}"/>
    <path fill="${colors.status.bg}" d="M${labelWidth} 0h4v${height}h-4z"/>
    <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11" font-weight="600">
      <text x="${labelWidth / 2}" y="15">${label}</text>
      <text x="${labelWidth + statusWidth / 2}" y="15">${status}</text>
    </g>
  </svg>`;
}

function generateModernBadge(
  label: string,
  status: string,
  colors: ReturnType<typeof getStatusColors>
): string {
  const width = 140;
  const height = 28;

  // Modern badge with logo icon and rounded corners
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:${colors.label.bg}"/>
        <stop offset="60%" style="stop-color:${colors.label.bg}"/>
        <stop offset="60%" style="stop-color:${colors.status.bg}"/>
        <stop offset="100%" style="stop-color:${colors.status.bg}"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.2"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" rx="6" fill="url(#bg)" filter="url(#shadow)"/>
    <!-- Logo icon -->
    <g transform="translate(8, 6)">
      <rect x="0" y="0" width="16" height="16" rx="3" fill="rgba(255,255,255,0.2)"/>
      <rect x="2" y="2" width="5" height="5" rx="1" fill="rgba(255,255,255,0.9)"/>
      <line x1="2" y1="10" x2="14" y2="10" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="2" y1="13" x2="10" y2="13" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="13" cy="3" r="3" fill="${colors.status.bg}"/>
      <path d="M11.5 3L12.5 4L14.5 2" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </g>
    <!-- Text -->
    <text x="30" y="18" fill="white" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11" font-weight="600">${label}</text>
    <text x="${width - 8}" y="18" fill="white" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11" font-weight="600" text-anchor="end">${status}</text>
  </svg>`;
}

function generateBadgeHtml(
  status: string,
  statusType: 'verified' | 'revoked' | 'expired' | 'error',
  theme: string,
  credentialId: string,
  agentName?: string
): string {
  const colors = getStatusColors(statusType, theme);
  const bgColor = theme === 'dark' ? '#1F2937' : '#FFFFFF';
  const textColor = theme === 'dark' ? '#F9FAFB' : '#111827';
  const borderColor = theme === 'dark' ? '#374151' : '#E5E7EB';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .badge-container {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: ${bgColor};
      border: 1px solid ${borderColor};
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }
    .badge-container:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(-1px);
    }
    .logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #4F46E5, #6366F1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo svg { width: 20px; height: 20px; }
    .content { display: flex; flex-direction: column; gap: 2px; }
    .agent-name { font-weight: 600; font-size: 14px; color: ${textColor}; }
    .status-row { display: flex; align-items: center; gap: 6px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: ${colors.status.bg};
      color: white;
      font-size: 11px;
      font-weight: 600;
      border-radius: 9999px;
    }
    .powered-by { font-size: 10px; color: #9CA3AF; }
  </style>
</head>
<body>
  <a href="https://agentid.dev/credentials/${credentialId}" target="_blank" rel="noopener" class="badge-container">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="white" stroke-width="1.5"/>
        <rect x="7" y="6" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
        <line x1="7" y1="14" x2="17" y2="14" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
        <line x1="7" y1="17" x2="14" y2="17" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
        <circle cx="17" cy="7" r="3.5" fill="#10B981" stroke="white" stroke-width="1"/>
        <path d="M15.5 7L16.5 8L18.5 6" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="content">
      ${agentName ? `<span class="agent-name">${escapeHtml(agentName)}</span>` : ''}
      <div class="status-row">
        <span class="status-badge">
          ${statusType === 'verified' ? '✓' : statusType === 'revoked' ? '✕' : '!'} ${status}
        </span>
        <span class="powered-by">by AgentID</span>
      </div>
    </div>
  </a>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
