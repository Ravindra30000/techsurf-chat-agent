import express from 'express';
import { query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { Request, Response } from 'express';

const router = express.Router();

// Validation for time range query parameters
const validateAnalyticsQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('endDate must be a valid ISO 8601 date'),
  query('period')
    .optional()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('period must be one of hour, day, week, month'),
];

// GET /api/analytics?period=day&startDate=2025-09-01&endDate=2025-09-19
router.get(
  '/',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 60 }),
  validateAnalyticsQuery,
  async (req: Request, res: Response) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      // Extract and normalize parameters
      const tenantId = (req as any).tenant.id;
      const period = (req.query.period as string) || 'day';
      const startDate: Date | undefined = req.query.startDate as unknown as Date;
      const endDate: Date | undefined = req.query.endDate as unknown as Date;

      // Fetch analytics from database service
      const db = req.app.locals.services.database;
      if (!db) {
        return res.status(503).json({ error: 'Database service unavailable' });
      }

      // Use database service to fetch analytics
      const analyticsData = await db.getAnalytics(
        tenantId,
        /* eventType */ undefined,
        startDate,
        endDate,
        /* limit */ 1000
      );

      // Compute summary stats if needed
      const summary = await db.getStats(tenantId);

      res.json({
        tenantId,
        period,
        dateRange: {
          start: startDate?.toISOString(),
          end: endDate?.toISOString(),
        },
        summary,
        data: analyticsData,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ Analytics fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch analytics', message: (err as Error).message });
    }
  }
);

export default router;
