/**
 * AgentID SDK Error Classes
 */

import type { ErrorCode } from './types';

/**
 * Base error class for all AgentID errors
 */
export class AgentIDError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'AgentIDError';
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when the verification request is malformed
 */
export class InvalidRequestError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('INVALID_REQUEST', message, requestId);
    this.name = 'InvalidRequestError';
  }
}

/**
 * Thrown when neither credential_id nor credential payload is provided
 */
export class MissingInputError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('MISSING_INPUT', message, requestId);
    this.name = 'MissingInputError';
  }
}

/**
 * Thrown when the credential cannot be found
 */
export class CredentialNotFoundError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('CREDENTIAL_NOT_FOUND', message, requestId);
    this.name = 'CredentialNotFoundError';
  }
}

/**
 * Thrown when the credential has been revoked
 */
export class CredentialRevokedError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('CREDENTIAL_REVOKED', message, requestId);
    this.name = 'CredentialRevokedError';
  }
}

/**
 * Thrown when the credential has expired
 */
export class CredentialExpiredError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('CREDENTIAL_EXPIRED', message, requestId);
    this.name = 'CredentialExpiredError';
  }
}

/**
 * Thrown when the credential is not yet valid
 */
export class CredentialNotYetValidError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('CREDENTIAL_NOT_YET_VALID', message, requestId);
    this.name = 'CredentialNotYetValidError';
  }
}

/**
 * Thrown when the credential signature is invalid
 */
export class InvalidSignatureError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('INVALID_SIGNATURE', message, requestId);
    this.name = 'InvalidSignatureError';
  }
}

/**
 * Thrown when the credential issuer cannot be found
 */
export class IssuerNotFoundError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('ISSUER_NOT_FOUND', message, requestId);
    this.name = 'IssuerNotFoundError';
  }
}

/**
 * Thrown when the server encounters an internal error
 */
export class InternalError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('INTERNAL_ERROR', message, requestId);
    this.name = 'InternalError';
  }
}

/**
 * Thrown when a network error occurs
 */
export class NetworkError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('NETWORK_ERROR', message, requestId);
    this.name = 'NetworkError';
  }
}

/**
 * Thrown when the request times out
 */
export class TimeoutError extends AgentIDError {
  constructor(message: string, requestId?: string) {
    super('TIMEOUT_ERROR', message, requestId);
    this.name = 'TimeoutError';
  }
}

/**
 * Create an error instance from an error code
 */
export function createErrorFromCode(
  code: ErrorCode,
  message: string,
  requestId?: string
): AgentIDError {
  switch (code) {
    case 'INVALID_REQUEST':
      return new InvalidRequestError(message, requestId);
    case 'MISSING_INPUT':
      return new MissingInputError(message, requestId);
    case 'CREDENTIAL_NOT_FOUND':
      return new CredentialNotFoundError(message, requestId);
    case 'CREDENTIAL_REVOKED':
      return new CredentialRevokedError(message, requestId);
    case 'CREDENTIAL_EXPIRED':
      return new CredentialExpiredError(message, requestId);
    case 'CREDENTIAL_NOT_YET_VALID':
      return new CredentialNotYetValidError(message, requestId);
    case 'INVALID_SIGNATURE':
      return new InvalidSignatureError(message, requestId);
    case 'ISSUER_NOT_FOUND':
      return new IssuerNotFoundError(message, requestId);
    case 'NETWORK_ERROR':
      return new NetworkError(message, requestId);
    case 'TIMEOUT_ERROR':
      return new TimeoutError(message, requestId);
    case 'INTERNAL_ERROR':
    default:
      return new InternalError(message, requestId);
  }
}
