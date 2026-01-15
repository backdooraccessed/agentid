/**
 * Express middleware for AgentID verification
 */

import type { NextFunction, Request, Response } from 'express';

import { CredentialVerifier, checkPermission } from '../verifier';
import type {
  CredentialPayload,
  MiddlewareOptions,
  VerificationResult,
  VerifierOptions,
} from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      /** AgentID credential (set by agentIDMiddleware) */
      agentCredential?: CredentialPayload;
      /** AgentID verification result */
      agentIDVerification?: VerificationResult;
    }
  }
}

/**
 * Create Express middleware for AgentID verification.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { agentIDMiddleware } from '@agentid/sdk/express';
 *
 * const app = express();
 *
 * // Protect all /api routes
 * app.use('/api', agentIDMiddleware({
 *   required: true,
 *   minTrustScore: 50,
 *   requiredPermissions: ['api:access'],
 * }));
 *
 * app.get('/api/data', (req, res) => {
 *   const { agent_name } = req.agentCredential!;
 *   res.json({ message: `Hello, ${agent_name}!` });
 * });
 * ```
 */
export function agentIDMiddleware(
  options: MiddlewareOptions & VerifierOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const {
    required = true,
    minTrustScore,
    requiredPermissions,
    policy,
    onError,
    ...verifierOptions
  } = options;

  const verifier = new CredentialVerifier(verifierOptions);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract headers
      const headers: Record<string, string | undefined> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        headers[key] = Array.isArray(value) ? value[0] : value;
      }

      // Get body for signature verification
      let body: string | null = null;
      if (req.body && typeof req.body === 'object') {
        body = JSON.stringify(req.body);
      } else if (typeof req.body === 'string') {
        body = req.body;
      }

      // Verify request
      const result = await verifier.verifyRequest({
        headers,
        method: req.method,
        url: req.originalUrl,
        body,
      });

      // Store result on request
      req.agentIDVerification = result;

      // Check if credential is valid
      if (!result.valid) {
        if (required) {
          res.status(401).json({
            error: result.error ?? 'Invalid credential',
            code: result.error_code ?? 'INVALID_CREDENTIAL',
          });
          return;
        }
        // Not required, continue without credential
        next();
        return;
      }

      // Store credential on request
      req.agentCredential = result.credential;

      // Check minimum trust score
      if (minTrustScore !== undefined && result.trust_score !== undefined) {
        if (result.trust_score < minTrustScore) {
          res.status(403).json({
            error: 'Insufficient trust score',
            code: 'INSUFFICIENT_TRUST_SCORE',
            required: minTrustScore,
            actual: result.trust_score,
          });
          return;
        }
      }

      // Check required permissions
      if (requiredPermissions && requiredPermissions.length > 0 && result.credential) {
        for (const permission of requiredPermissions) {
          const allowed = checkPermission(result.credential.permissions, {
            resource: req.originalUrl,
            action: permission,
          });

          if (!allowed.granted) {
            res.status(403).json({
              error: 'Permission denied',
              code: 'PERMISSION_DENIED',
              required: permission,
              reason: allowed.reason,
            });
            return;
          }
        }
      }

      // Run custom policy
      if (policy && result.credential) {
        const allowed = await policy(result.credential, req);
        if (!allowed) {
          res.status(403).json({
            error: 'Policy denied',
            code: 'POLICY_DENIED',
          });
          return;
        }
      }

      next();
    } catch (error) {
      if (onError) {
        onError(error as Error, req, res, next);
        return;
      }

      // Default error handling
      console.error('AgentID middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

/**
 * Create a middleware that requires specific permissions.
 *
 * @example
 * ```typescript
 * app.post('/api/users',
 *   requirePermission('users:write'),
 *   (req, res) => { ... }
 * );
 * ```
 */
export function requirePermission(
  ...permissions: string[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.agentCredential) {
      res.status(401).json({
        error: 'No credential',
        code: 'NO_CREDENTIAL',
      });
      return;
    }

    for (const permission of permissions) {
      const allowed = checkPermission(req.agentCredential.permissions, {
        resource: req.originalUrl,
        action: permission,
      });

      if (!allowed.granted) {
        res.status(403).json({
          error: 'Permission denied',
          code: 'PERMISSION_DENIED',
          required: permission,
          reason: allowed.reason,
        });
        return;
      }
    }

    next();
  };
}

/**
 * Create a middleware that requires minimum trust score.
 *
 * @example
 * ```typescript
 * app.post('/api/sensitive',
 *   requireTrustScore(80),
 *   (req, res) => { ... }
 * );
 * ```
 */
export function requireTrustScore(
  minScore: number
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const trustScore = req.agentIDVerification?.trust_score;

    if (trustScore === undefined) {
      res.status(401).json({
        error: 'No trust score available',
        code: 'NO_TRUST_SCORE',
      });
      return;
    }

    if (trustScore < minScore) {
      res.status(403).json({
        error: 'Insufficient trust score',
        code: 'INSUFFICIENT_TRUST_SCORE',
        required: minScore,
        actual: trustScore,
      });
      return;
    }

    next();
  };
}
