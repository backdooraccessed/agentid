/**
 * Express server example for AgentID TypeScript SDK
 *
 * This example shows how to use the Express middleware to protect
 * API routes and verify agent credentials.
 */

import express from 'express';

import {
  agentIDMiddleware,
  requirePermission,
  requireTrustScore,
} from '../src/middleware/express';
import { checkPermission } from '../src/verifier';

const app = express();

// Parse JSON bodies
app.use(express.json());

// Example 1: Basic protection
// Protect all /api routes with AgentID verification
app.use(
  '/api',
  agentIDMiddleware({
    required: true, // Require valid credential
    minTrustScore: 50, // Minimum trust score
  })
);

// Simple protected endpoint
app.get('/api/data', (req, res) => {
  const { agent_name, agent_id } = req.agentCredential!;
  res.json({
    message: `Hello, ${agent_name}!`,
    agentId: agent_id,
    trustScore: req.agentIDVerification?.trust_score,
  });
});

// Example 2: Per-route permission checks
app.get('/api/users', (req, res) => {
  // Any authenticated agent can read users
  res.json({ users: [{ id: 1, name: 'Alice' }] });
});

app.post(
  '/api/users',
  requirePermission('users:write'),
  (req, res) => {
    // Only agents with 'users:write' permission
    const user = req.body;
    res.json({ created: true, user });
  }
);

// Example 3: Require high trust score for sensitive operations
app.post(
  '/api/payments',
  requireTrustScore(80),
  (req, res) => {
    // Only high-trust agents can create payments
    const payment = req.body;
    res.json({ processed: true, payment });
  }
);

// Example 4: Custom permission checking in handler
app.post('/api/transactions', (req, res) => {
  const credential = req.agentCredential!;
  const { amount } = req.body;

  // Check permission with context
  const allowed = checkPermission(credential.permissions, {
    resource: '/api/transactions',
    action: 'write',
    context: { amount },
  });

  if (!allowed.granted) {
    res.status(403).json({
      error: 'Permission denied',
      reason: allowed.reason,
    });
    return;
  }

  res.json({ success: true, amount });
});

// Example 5: Optional authentication
app.get(
  '/api/public',
  agentIDMiddleware({ required: false }),
  (req, res) => {
    if (req.agentCredential) {
      // Authenticated request - personalized response
      res.json({
        message: `Welcome back, ${req.agentCredential.agent_name}!`,
        authenticated: true,
      });
    } else {
      // Anonymous request
      res.json({
        message: 'Welcome, anonymous agent!',
        authenticated: false,
      });
    }
  }
);

// Example 6: Custom policy
app.use(
  '/api/admin',
  agentIDMiddleware({
    required: true,
    minTrustScore: 90,
    policy: async (credential) => {
      // Only allow verified issuers
      return credential.issuer.is_verified;
    },
  })
);

app.get('/api/admin/dashboard', (req, res) => {
  res.json({ admin: true, data: {} });
});

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Start server
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('\nEndpoints:');
    console.log('  GET  /api/data          - Basic protected endpoint');
    console.log('  GET  /api/users         - List users (authenticated)');
    console.log('  POST /api/users         - Create user (needs users:write)');
    console.log('  POST /api/payments      - Create payment (needs trust >= 80)');
    console.log('  POST /api/transactions  - Custom permission check');
    console.log('  GET  /api/public        - Optional authentication');
    console.log('  GET  /api/admin/*       - Admin only (verified issuer)');
  });
}

export default app;
