import { SAML, type SamlConfig } from '@node-saml/node-saml';

// Type for SAML profile from node-saml
interface SamlProfile {
  nameID?: string;
  nameIDFormat?: string;
  sessionIndex?: string;
  [key: string]: unknown;
}

export interface SSOConfiguration {
  id: string;
  issuer_id: string;
  provider: string;
  name: string;
  entity_id: string;
  sso_url: string;
  slo_url?: string;
  certificate: string;
  private_key?: string;
  attribute_mapping: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    [key: string]: string | undefined;
  };
  auto_provision: boolean;
  default_role: string;
  allowed_domains: string[];
  is_enabled: boolean;
}

export interface SAMLUserProfile {
  nameID: string;
  nameIDFormat?: string;
  sessionIndex?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  attributes: Record<string, string | string[]>;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agentid.dev';

/**
 * Get Service Provider entity ID
 */
export function getSpEntityId(issuerId: string): string {
  return `${APP_URL}/api/auth/saml/${issuerId}`;
}

/**
 * Get Assertion Consumer Service URL
 */
export function getAcsUrl(issuerId: string): string {
  return `${APP_URL}/api/auth/saml/${issuerId}/callback`;
}

/**
 * Get Single Logout Service URL
 */
export function getSloUrl(issuerId: string): string {
  return `${APP_URL}/api/auth/saml/${issuerId}/logout`;
}

/**
 * Create SAML instance from SSO configuration
 */
export function createSamlInstance(config: SSOConfiguration): SAML {
  const samlConfig: SamlConfig = {
    callbackUrl: getAcsUrl(config.issuer_id),
    entryPoint: config.sso_url,
    issuer: getSpEntityId(config.issuer_id),
    idpCert: config.certificate,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: false,
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',
    maxAssertionAgeMs: 60 * 60 * 1000, // 1 hour
    acceptedClockSkewMs: 5 * 60 * 1000, // 5 minutes
  };

  // Add private key if available (for signing requests)
  if (config.private_key) {
    samlConfig.privateKey = config.private_key;
  }

  // Add logout URL if available
  if (config.slo_url) {
    samlConfig.logoutUrl = config.slo_url;
  }

  return new SAML(samlConfig);
}

/**
 * Generate SAML authentication request URL
 */
export async function generateAuthUrl(config: SSOConfiguration, relayState?: string): Promise<string> {
  const saml = createSamlInstance(config);
  // getAuthorizeUrlAsync(relayState, host, options)
  const authUrl = await saml.getAuthorizeUrlAsync(relayState || '', APP_URL, {});
  return authUrl;
}

/**
 * Validate SAML response and extract user profile
 */
export async function validateSamlResponse(
  config: SSOConfiguration,
  samlResponse: string
): Promise<{ profile: SAMLUserProfile; loggedOut: boolean }> {
  const saml = createSamlInstance(config);

  const result = await saml.validatePostResponseAsync({
    SAMLResponse: samlResponse,
  });

  if (!result.profile) {
    throw new Error('No profile in SAML response');
  }

  const profile = result.profile as SamlProfile;
  const mapping = config.attribute_mapping;

  // Helper to get attribute value
  const getAttrValue = (key: string): string | undefined => {
    const value = profile[key];
    if (Array.isArray(value)) {
      return String(value[0]);
    }
    if (typeof value === 'string') {
      return value;
    }
    return undefined;
  };

  // Extract mapped attributes
  const userProfile: SAMLUserProfile = {
    nameID: profile.nameID || '',
    nameIDFormat: profile.nameIDFormat,
    sessionIndex: profile.sessionIndex,
    attributes: {},
  };

  // Map standard attributes
  if (mapping.email) {
    userProfile.email = getAttrValue(mapping.email);
  }

  if (mapping.firstName) {
    userProfile.firstName = getAttrValue(mapping.firstName);
  }

  if (mapping.lastName) {
    userProfile.lastName = getAttrValue(mapping.lastName);
  }

  if (mapping.role) {
    userProfile.role = getAttrValue(mapping.role);
  }

  // Store all attributes
  for (const [key, value] of Object.entries(profile)) {
    if (typeof value === 'string') {
      userProfile.attributes[key] = value;
    } else if (Array.isArray(value)) {
      userProfile.attributes[key] = value.map(String);
    }
  }

  return { profile: userProfile, loggedOut: result.loggedOut || false };
}

/**
 * Generate Service Provider metadata XML
 */
export function generateSpMetadata(issuerId: string, config?: Partial<SSOConfiguration>): string {
  const entityId = getSpEntityId(issuerId);
  const acsUrl = getAcsUrl(issuerId);
  const sloUrl = getSloUrl(issuerId);

  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${entityId}">
  <SPSSODescriptor AuthnRequestsSigned="false"
                   WantAssertionsSigned="true"
                   protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</NameIDFormat>
    <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="${acsUrl}"
                              index="0"
                              isDefault="true"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                         Location="${sloUrl}"/>
  </SPSSODescriptor>
  <Organization>
    <OrganizationName xml:lang="en">AgentID</OrganizationName>
    <OrganizationDisplayName xml:lang="en">AgentID - Agent Identity Platform</OrganizationDisplayName>
    <OrganizationURL xml:lang="en">${APP_URL}</OrganizationURL>
  </Organization>
</EntityDescriptor>`;
}

/**
 * Validate email domain against allowed domains
 */
export function isEmailDomainAllowed(email: string, allowedDomains: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true; // No domain restrictions
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return false;
  }

  return allowedDomains.some(allowed => {
    const normalizedAllowed = allowed.toLowerCase().replace(/^@/, '');
    return domain === normalizedAllowed;
  });
}

/**
 * Map SAML role to team role
 */
export function mapSamlRoleToTeamRole(samlRole: string | undefined, defaultRole: string): string {
  if (!samlRole) {
    return defaultRole;
  }

  const roleMapping: Record<string, string> = {
    'admin': 'admin',
    'administrator': 'admin',
    'owner': 'owner',
    'member': 'member',
    'viewer': 'viewer',
    'readonly': 'viewer',
    'read-only': 'viewer',
  };

  const normalizedRole = samlRole.toLowerCase().trim();
  return roleMapping[normalizedRole] || defaultRole;
}
