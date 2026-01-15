/**
 * AgentID SDK Errors
 */

/** Base error for AgentID SDK */
export class AgentIDError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code = 'AGENTID_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'AgentIDError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AgentIDError.prototype);
  }
}

/** Credential not found */
export class CredentialNotFoundError extends AgentIDError {
  constructor(credentialId: string) {
    super(`Credential not found: ${credentialId}`, 'CREDENTIAL_NOT_FOUND');
    this.name = 'CredentialNotFoundError';
    Object.setPrototypeOf(this, CredentialNotFoundError.prototype);
  }
}

/** Credential has expired */
export class CredentialExpiredError extends AgentIDError {
  constructor(message = 'Credential has expired') {
    super(message, 'CREDENTIAL_EXPIRED');
    this.name = 'CredentialExpiredError';
    Object.setPrototypeOf(this, CredentialExpiredError.prototype);
  }
}

/** Credential has been revoked */
export class CredentialRevokedError extends AgentIDError {
  constructor(message = 'Credential has been revoked') {
    super(message, 'CREDENTIAL_REVOKED');
    this.name = 'CredentialRevokedError';
    Object.setPrototypeOf(this, CredentialRevokedError.prototype);
  }
}

/** Credential is invalid */
export class CredentialInvalidError extends AgentIDError {
  constructor(message = 'Credential is invalid') {
    super(message, 'CREDENTIAL_INVALID');
    this.name = 'CredentialInvalidError';
    Object.setPrototypeOf(this, CredentialInvalidError.prototype);
  }
}

/** Authentication failed */
export class AuthenticationError extends AgentIDError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/** Rate limit exceeded */
export class RateLimitError extends AgentIDError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/** Network error */
export class NetworkError extends AgentIDError {
  constructor(message = 'Network error', cause?: Error) {
    super(message, 'NETWORK_ERROR', { cause: cause?.message });
    this.name = 'NetworkError';
    this.cause = cause;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/** Signature error */
export class SignatureError extends AgentIDError {
  constructor(message = 'Signature verification failed') {
    super(message, 'SIGNATURE_ERROR');
    this.name = 'SignatureError';
    Object.setPrototypeOf(this, SignatureError.prototype);
  }
}
