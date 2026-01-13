/**
 * Reputation calculation and update utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy-initialized service client for reputation operations
let serviceClient: SupabaseClient<any> | null = null;

function getServiceClient(): SupabaseClient<any> {
  if (!serviceClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration for reputation service');
    }
    serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return serviceClient;
}

/**
 * Reputation weights
 */
const WEIGHTS = {
  VERIFICATION: 0.30,
  LONGEVITY: 0.25,
  ACTIVITY: 0.20,
  ISSUER: 0.25,
} as const;

/**
 * Calculate longevity score based on credential age
 */
export function calculateLongevityScore(createdAt: Date): number {
  const daysActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysActive >= 365) return 100;
  if (daysActive >= 180) return 75 + Math.floor((daysActive - 180) * 25 / 185);
  if (daysActive >= 90) return 50 + Math.floor((daysActive - 90) * 25 / 90);
  if (daysActive >= 30) return 25 + Math.floor((daysActive - 30) * 25 / 60);
  return Math.floor(daysActive * 25 / 30);
}

/**
 * Calculate verification score based on success rate
 */
export function calculateVerificationScore(total: number, successful: number): number {
  if (total === 0) return 50;

  const rate = successful / total;
  const baseScore = Math.round(rate * 100);
  const volumeBonus = Math.min(10, Math.floor(total / 10));

  return Math.min(100, Math.max(0, baseScore + volumeBonus));
}

/**
 * Calculate activity score based on last verification
 */
export function calculateActivityScore(lastVerification: Date | null): number {
  if (!lastVerification) return 50;

  const daysSince = Math.floor((Date.now() - lastVerification.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince <= 1) return 100;
  if (daysSince <= 7) return 100 - Math.floor((daysSince - 1) * 20 / 6);
  if (daysSince <= 30) return 80 - Math.floor((daysSince - 7) * 30 / 23);
  if (daysSince <= 90) return 50 - Math.floor((daysSince - 30) * 25 / 60);
  if (daysSince <= 180) return 25 - Math.floor((daysSince - 90) * 15 / 90);
  return 10;
}

/**
 * Calculate composite trust score
 */
export function calculateTrustScore(
  verificationScore: number,
  longevityScore: number,
  activityScore: number,
  issuerVerified: boolean
): number {
  const issuerBonus = issuerVerified ? 100 : 50;

  const weightedScore =
    verificationScore * WEIGHTS.VERIFICATION +
    longevityScore * WEIGHTS.LONGEVITY +
    activityScore * WEIGHTS.ACTIVITY +
    issuerBonus * WEIGHTS.ISSUER;

  return Math.round(weightedScore);
}

/**
 * Update agent reputation after a verification
 */
export async function updateAgentReputation(
  credentialId: string,
  isValid: boolean
): Promise<void> {
  const supabase = getServiceClient();

  // Get credential info
  const { data: credential, error: credError } = await supabase
    .from('credentials')
    .select(`
      id,
      agent_id,
      issuer_id,
      created_at,
      issuers!inner (is_verified)
    `)
    .eq('id', credentialId)
    .single();

  if (credError || !credential) {
    console.error('Failed to get credential for reputation update:', credError);
    return;
  }

  // Extract issuer verification status
  const issuerVerified = (credential.issuers as unknown as { is_verified: boolean }).is_verified;

  // Get or create reputation record
  const { data: existingRep } = await supabase
    .from('agent_reputation')
    .select('*')
    .eq('credential_id', credentialId)
    .single();

  const now = new Date();

  if (!existingRep) {
    // Create new reputation record
    const longevityScore = calculateLongevityScore(new Date(credential.created_at));
    const verificationScore = isValid ? 100 : 0;
    const activityScore = 100; // Just verified
    const trustScore = calculateTrustScore(
      verificationScore,
      longevityScore,
      activityScore,
      issuerVerified
    );

    await supabase.from('agent_reputation').insert({
      agent_id: credential.agent_id,
      credential_id: credentialId,
      issuer_id: credential.issuer_id,
      trust_score: trustScore,
      verification_score: verificationScore,
      longevity_score: longevityScore,
      activity_score: activityScore,
      total_verifications: 1,
      successful_verifications: isValid ? 1 : 0,
      failed_verifications: isValid ? 0 : 1,
      last_verification_at: now.toISOString(),
    });
  } else {
    // Update existing reputation
    const totalVerifications = existingRep.total_verifications + 1;
    const successfulVerifications = existingRep.successful_verifications + (isValid ? 1 : 0);
    const failedVerifications = existingRep.failed_verifications + (isValid ? 0 : 1);

    const longevityScore = calculateLongevityScore(new Date(credential.created_at));
    const verificationScore = calculateVerificationScore(totalVerifications, successfulVerifications);
    const activityScore = 100; // Just verified

    const trustScore = calculateTrustScore(
      verificationScore,
      longevityScore,
      activityScore,
      issuerVerified
    );

    await supabase
      .from('agent_reputation')
      .update({
        trust_score: trustScore,
        verification_score: verificationScore,
        longevity_score: longevityScore,
        activity_score: activityScore,
        total_verifications: totalVerifications,
        successful_verifications: successfulVerifications,
        failed_verifications: failedVerifications,
        last_verification_at: now.toISOString(),
      })
      .eq('credential_id', credentialId);
  }

  // Update issuer reputation
  await updateIssuerReputation(credential.issuer_id);
}

/**
 * Update issuer reputation
 */
async function updateIssuerReputation(issuerId: string): Promise<void> {
  const supabase = getServiceClient();

  // Calculate issuer statistics
  const { data: stats } = await supabase
    .from('credentials')
    .select('status')
    .eq('issuer_id', issuerId);

  if (!stats) return;

  const total = stats.length;
  const active = stats.filter((s) => s.status === 'active').length;
  const revoked = stats.filter((s) => s.status === 'revoked').length;
  const expired = stats.filter((s) => s.status === 'expired').length;

  // Get aggregate verification stats
  const { data: verificationStats } = await supabase
    .from('agent_reputation')
    .select('total_verifications, successful_verifications')
    .eq('issuer_id', issuerId);

  const totalVerifications = verificationStats?.reduce((sum, r) => sum + r.total_verifications, 0) || 0;
  const successfulVerifications = verificationStats?.reduce((sum, r) => sum + r.successful_verifications, 0) || 0;

  // Calculate issuer trust score
  const revokeRate = total > 0 ? revoked / total : 0;
  const successRate = totalVerifications > 0 ? successfulVerifications / totalVerifications : 1;
  const trustScore = Math.round((1 - revokeRate * 0.5) * successRate * 100);

  // Upsert issuer reputation
  await supabase
    .from('issuer_reputation')
    .upsert({
      issuer_id: issuerId,
      trust_score: Math.min(100, Math.max(0, trustScore)),
      total_credentials: total,
      active_credentials: active,
      revoked_credentials: revoked,
      expired_credentials: expired,
      total_verifications: totalVerifications,
      successful_verifications: successfulVerifications,
    });
}

/**
 * Get agent reputation info
 */
export async function getAgentReputation(credentialId: string): Promise<{
  trust_score: number;
  verification_count: number;
  success_rate: number;
  credential_age_days: number;
  issuer_verified: boolean;
} | null> {
  const supabase = getServiceClient();

  const { data: rep } = await supabase
    .from('agent_reputation')
    .select(`
      trust_score,
      total_verifications,
      successful_verifications,
      credential_id,
      credentials!inner (
        created_at,
        issuers!inner (is_verified)
      )
    `)
    .eq('credential_id', credentialId)
    .single();

  if (!rep) return null;

  // Extract nested data with proper typing
  const cred = rep.credentials as unknown as {
    created_at: string;
    issuers: { is_verified: boolean };
  };

  const credentialAgeMs = Date.now() - new Date(cred.created_at).getTime();
  const credentialAgeDays = Math.floor(credentialAgeMs / (1000 * 60 * 60 * 24));

  return {
    trust_score: rep.trust_score,
    verification_count: rep.total_verifications,
    success_rate: rep.total_verifications > 0
      ? rep.successful_verifications / rep.total_verifications
      : 1,
    credential_age_days: credentialAgeDays,
    issuer_verified: cred.issuers.is_verified,
  };
}

/**
 * Get issuer reputation info
 */
export async function getIssuerReputation(issuerId: string): Promise<{
  trust_score: number;
  total_credentials: number;
  active_credentials: number;
  revoked_rate: number;
  verification_success_rate: number;
} | null> {
  const supabase = getServiceClient();

  const { data: rep } = await supabase
    .from('issuer_reputation')
    .select('*')
    .eq('issuer_id', issuerId)
    .single();

  if (!rep) return null;

  return {
    trust_score: rep.trust_score,
    total_credentials: rep.total_credentials,
    active_credentials: rep.active_credentials,
    revoked_rate: rep.total_credentials > 0
      ? rep.revoked_credentials / rep.total_credentials
      : 0,
    verification_success_rate: rep.total_verifications > 0
      ? rep.successful_verifications / rep.total_verifications
      : 1,
  };
}

/**
 * Get leaderboard of top agents
 */
export async function getReputationLeaderboard(limit: number = 10): Promise<Array<{
  rank: number;
  agent_id: string;
  agent_name: string;
  trust_score: number;
  verification_count: number;
  issuer_name: string;
  issuer_verified: boolean;
}>> {
  try {
    const supabase = getServiceClient();

    const { data: leaderboard, error } = await supabase
      .from('agent_reputation')
      .select(`
        trust_score,
        total_verifications,
        credentials!inner (
          agent_id,
          agent_name,
          status,
          issuers!inner (name, is_verified)
        )
      `)
      .order('trust_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Leaderboard query error:', error);
      return [];
    }

    if (!leaderboard || leaderboard.length === 0) return [];

  // Filter for active credentials client-side (PostgREST nested filtering limitation)
  const activeLeaderboard = leaderboard.filter((entry) => {
    const cred = entry.credentials as unknown as { status: string };
    return cred.status === 'active';
  });

  return activeLeaderboard.map((entry, index) => {
    // Extract nested data with proper typing
    const cred = entry.credentials as unknown as {
      agent_id: string;
      agent_name: string;
      issuers: { name: string; is_verified: boolean };
    };

    return {
      rank: index + 1,
      agent_id: cred.agent_id,
      agent_name: cred.agent_name,
      trust_score: entry.trust_score,
      verification_count: entry.total_verifications,
      issuer_name: cred.issuers.name,
      issuer_verified: cred.issuers.is_verified,
    };
  });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return [];
  }
}
