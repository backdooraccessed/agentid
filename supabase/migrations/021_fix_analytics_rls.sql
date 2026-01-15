-- =============================================================================
-- Fix RLS for issuer_analytics table
-- =============================================================================
-- The update_credential_analytics() trigger function tries to insert/update
-- issuer_analytics when credentials are created, but the RLS policy only
-- allowed SELECT. Making the functions SECURITY DEFINER allows them to
-- bypass RLS when called by triggers.
-- =============================================================================

-- Make the trigger functions run as SECURITY DEFINER
-- This allows them to bypass RLS when called by triggers
ALTER FUNCTION update_credential_analytics() SECURITY DEFINER;
ALTER FUNCTION update_daily_analytics() SECURITY DEFINER;
