/**
 * Email service using Resend
 * Handles team invitations, alert notifications, and weekly digests
 */

import { Resend } from 'resend';

// Lazy-initialized Resend client
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'AgentID <noreply@agentid.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agentid.dev';

/**
 * Check if email sending is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitationEmail(params: {
  email: string;
  inviterName: string;
  issuerName: string;
  role: string;
  token: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.log('[Email] Skipping team invitation - email not configured');
    return { success: false, error: 'Email not configured' };
  }

  const { email, inviterName, issuerName, role, token } = params;
  const inviteLink = `${APP_URL}/invite/${token}`;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You've been invited to join ${issuerName} on AgentID`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 48px; height: 48px; background: black; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">A</div>
      </div>

      <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 16px; color: #18181b; text-align: center;">
        You're invited to join ${escapeHtml(issuerName)}
      </h1>

      <p style="font-size: 16px; color: #52525b; margin: 0 0 24px; text-align: center; line-height: 1.6;">
        ${escapeHtml(inviterName)} has invited you to join their team on AgentID as a <strong>${escapeHtml(role)}</strong>.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: #18181b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">
          Accept Invitation
        </a>
      </div>

      <p style="font-size: 14px; color: #71717a; margin: 24px 0 0; text-align: center;">
        This invitation expires in 7 days.
      </p>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

      <p style="font-size: 12px; color: #a1a1aa; margin: 0; text-align: center;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>

    <p style="font-size: 12px; color: #a1a1aa; margin: 24px 0 0; text-align: center;">
      AgentID - Credential Infrastructure for AI Agents
    </p>
  </div>
</body>
</html>
      `,
      text: `You've been invited to join ${issuerName} on AgentID

${inviterName} has invited you to join their team as a ${role}.

Accept the invitation: ${inviteLink}

This invitation expires in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
AgentID - Credential Infrastructure for AI Agents
`,
    });

    if (error) {
      console.error('[Email] Failed to send team invitation:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Team invitation sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error('[Email] Error sending team invitation:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send alert notification email
 */
export async function sendAlertNotificationEmail(params: {
  email: string;
  alertTitle: string;
  alertMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ruleName: string;
  credentialId?: string;
  eventData?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.log('[Email] Skipping alert notification - email not configured');
    return { success: false, error: 'Email not configured' };
  }

  const { email, alertTitle, alertMessage, severity, ruleName, credentialId } = params;
  const dashboardLink = `${APP_URL}/alerts`;

  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
    medium: { bg: '#fefce8', text: '#854d0e', border: '#fde047' },
    high: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
    critical: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
  };

  const colors = severityColors[severity] || severityColors.medium;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `[${severity.toUpperCase()}] ${alertTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 48px; height: 48px; background: black; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">A</div>
      </div>

      <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="background: ${colors.text}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${severity}</span>
          <span style="font-size: 14px; color: ${colors.text}; font-weight: 500;">${escapeHtml(ruleName)}</span>
        </div>
        <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px; color: #18181b;">
          ${escapeHtml(alertTitle)}
        </h2>
        <p style="font-size: 14px; color: #52525b; margin: 0; line-height: 1.5;">
          ${escapeHtml(alertMessage)}
        </p>
      </div>

      ${credentialId ? `
      <div style="background: #f4f4f5; border-radius: 6px; padding: 12px; margin-bottom: 24px;">
        <p style="font-size: 12px; color: #71717a; margin: 0 0 4px;">Credential ID</p>
        <code style="font-size: 13px; color: #18181b; font-family: monospace;">${escapeHtml(credentialId)}</code>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${dashboardLink}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
          View in Dashboard
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

      <p style="font-size: 12px; color: #a1a1aa; margin: 0; text-align: center;">
        You're receiving this because you have alert notifications enabled for this rule.
      </p>
    </div>

    <p style="font-size: 12px; color: #a1a1aa; margin: 24px 0 0; text-align: center;">
      AgentID - Credential Infrastructure for AI Agents
    </p>
  </div>
</body>
</html>
      `,
      text: `[${severity.toUpperCase()}] ${alertTitle}

Rule: ${ruleName}

${alertMessage}

${credentialId ? `Credential ID: ${credentialId}` : ''}

View in Dashboard: ${dashboardLink}

---
You're receiving this because you have alert notifications enabled for this rule.

AgentID - Credential Infrastructure for AI Agents
`,
    });

    if (error) {
      console.error('[Email] Failed to send alert notification:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Alert notification sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error('[Email] Error sending alert notification:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send A2A authorization request notification
 */
export async function sendAuthorizationRequestEmail(params: {
  email: string;
  requesterAgentName: string;
  requesterAgentId: string;
  requestedPermissions: string[];
  scopeDescription?: string;
  authorizationId: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.log('[Email] Skipping authorization request notification - email not configured');
    return { success: false, error: 'Email not configured' };
  }

  const { email, requesterAgentName, requesterAgentId, requestedPermissions, scopeDescription, authorizationId } = params;
  const dashboardLink = `${APP_URL}/authorizations`;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Authorization Request from ${requesterAgentName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 48px; height: 48px; background: black; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">A</div>
      </div>

      <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 16px; color: #18181b; text-align: center;">
        Authorization Request
      </h1>

      <p style="font-size: 16px; color: #52525b; margin: 0 0 24px; text-align: center; line-height: 1.6;">
        <strong>${escapeHtml(requesterAgentName)}</strong> is requesting permission to access your agent.
      </p>

      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 12px; color: #71717a; margin: 0 0 8px; font-weight: 500;">REQUESTED PERMISSIONS</p>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #18181b;">
          ${requestedPermissions.map(p => `<li style="margin-bottom: 4px;">${escapeHtml(p)}</li>`).join('')}
        </ul>
        ${scopeDescription ? `
        <p style="font-size: 12px; color: #71717a; margin: 16px 0 8px; font-weight: 500;">SCOPE</p>
        <p style="margin: 0; font-size: 14px; color: #52525b;">${escapeHtml(scopeDescription)}</p>
        ` : ''}
      </div>

      <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 12px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #854d0e; margin: 0;">
          Review this request carefully before approving. Only grant permissions to agents you trust.
        </p>
      </div>

      <div style="text-align: center;">
        <a href="${dashboardLink}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
          Review Request
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

      <p style="font-size: 12px; color: #a1a1aa; margin: 0; text-align: center;">
        Agent ID: ${escapeHtml(requesterAgentId)}
      </p>
    </div>

    <p style="font-size: 12px; color: #a1a1aa; margin: 24px 0 0; text-align: center;">
      AgentID - Credential Infrastructure for AI Agents
    </p>
  </div>
</body>
</html>
      `,
      text: `Authorization Request from ${requesterAgentName}

${requesterAgentName} is requesting permission to access your agent.

Requested Permissions:
${requestedPermissions.map(p => `- ${p}`).join('\n')}

${scopeDescription ? `Scope: ${scopeDescription}` : ''}

Review this request carefully before approving. Only grant permissions to agents you trust.

Review Request: ${dashboardLink}

Agent ID: ${requesterAgentId}

---
AgentID - Credential Infrastructure for AI Agents
`,
    });

    if (error) {
      console.error('[Email] Failed to send authorization request notification:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Authorization request notification sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error('[Email] Error sending authorization request notification:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Escape HTML characters for safe email content
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
