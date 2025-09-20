import express from 'express';
import { header, validationResult } from 'express-validator';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { Request, Response } from 'express';

const router = express.Router();

// Validate headers for API key and tenant
const validateWidgetHeaders = [
  header('x-api-key').exists().withMessage('API key is required'),
  header('x-tenant-id').isUUID().withMessage('Valid tenant ID is required'),
];

// GET /api/widget/config
router.get(
  '/config',
  validateWidgetHeaders,
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 120 }),
  async (req: Request, res: Response) => {
    // Validate headers
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Header validation failed', details: errors.array() });
    }

    try {
      // Extract credentials
      const apiKey = req.header('x-api-key')!;
      const tenantId = req.header('x-tenant-id')!;

      // Verify API key and tenant
      const db = req.app.locals.services.database;
      if (!db) {
        return res.status(503).json({ error: 'Database service unavailable' });
      }
      const tenant = await db.getTenantByApiKey(apiKey);
      if (!tenant || tenant.id !== tenantId) {
        return res.status(403).json({ error: 'Invalid API key or tenant' });
      }
      if (tenant.status !== 'active') {
        return res.status(403).json({ error: 'Tenant is not active' });
      }

      // Return widget configuration
      return res.json({
        tenantId,
        widgetConfig: tenant.widget_config,
        features: {
          analytics: process.env.ENABLE_ANALYTICS === 'true',
          rateLimiting: process.env.ENABLE_RATE_LIMITING === 'true',
          caching: process.env.ENABLE_CACHING === 'true',
        },
        apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`,
        version: process.env.npm_package_version,
      });
    } catch (err) {
      console.error('❌ Widget config error:', err);
      res.status(500).json({ error: 'Failed to fetch widget config', message: (err as Error).message });
    }
  }
);

// POST /api/widget/track
// Track widget events (e.g., open, close, message_sent)
router.post(
  '/track',
  validateWidgetHeaders,
  express.json({ limit: '50kb' }),
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 200 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Header validation failed', details: errors.array() });
    }

    try {
      const apiKey = req.header('x-api-key')!;
      const tenantId = req.header('x-tenant-id')!;
      const { eventType, eventData, sessionId, timestamp } = req.body as {
        eventType: string;
        eventData: any;
        sessionId?: string;
        timestamp?: string;
      };

      // Validate payload
      if (!eventType) {
        return res.status(400).json({ error: 'eventType is required' });
      }

      // Persist analytics event
      const db = req.app.locals.services.database;
      if (!db) {
        return res.status(503).json({ error: 'Database service unavailable' });
      }
      await db.createAnalyticsEvent({
        tenant_id: tenantId,
        conversation_id: eventData?.conversationId,
        event_type: eventType,
        event_data: eventData,
        session_id: sessionId,
        user_id: (req as any).user?.id,
      });

      res.status(201).json({ message: 'Event tracked', eventType, timestamp: timestamp || new Date().toISOString() });
    } catch (err) {
      console.error('❌ Widget track error:', err);
      res.status(500).json({ error: 'Failed to track event', message: (err as Error).message });
    }
  }
);

export default router;
