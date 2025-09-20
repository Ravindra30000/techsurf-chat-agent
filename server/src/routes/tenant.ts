import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { authMiddleware } from '../middleware/auth.js';
import { DatabaseService, TenantRecord } from '../services/database-service.js';
import crypto from 'crypto';

const router = express.Router();

// Validation middleware
const validateCreateTenant = [
  body('name').isLength({ min: 2, max: 100 }).withMessage('Tenant name must be 2-100 characters'),
  body('domain').isLength({ min: 3, max: 253 }).matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/).withMessage('Valid domain is required'),
  body('plan').optional().isIn(['free', 'pro', 'enterprise']).withMessage('Invalid plan type'),
  body('contentstackConfig').optional().isObject().withMessage('Contentstack config must be an object'),
  body('widgetConfig').optional().isObject().withMessage('Widget config must be an object')
];

const validateUpdateTenant = [
  param('tenantId').isUUID().withMessage('Valid tenant ID is required'),
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Tenant name must be 2-100 characters'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  body('plan').optional().isIn(['free', 'pro', 'enterprise']).withMessage('Invalid plan type'),
  body('contentstackConfig').optional().isObject().withMessage('Contentstack config must be an object'),
  body('widgetConfig').optional().isObject().withMessage('Widget config must be an object')
];

// Generate API key for tenant
function generateApiKey(): string {
  return `ts_${crypto.randomBytes(32).toString('hex')}`;
}

// Create a new tenant
router.post('/',
  rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 10 }), // 10 tenant creations per hour
  validateCreateTenant,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { name, domain, plan = 'free', contentstackConfig, widgetConfig } = req.body;

      const services = req.app.locals.services;
      if (!services?.database) {
        return res.status(503).json({ error: 'Database service unavailable' });
      }

      const dbService: DatabaseService = services.database;

      // Check if domain already exists
      const existingTenant = await dbService.getTenantByDomain(domain);
      if (existingTenant) {
        return res.status(409).json({
          error: 'Domain already exists',
          message: 'A tenant with this domain already exists'
        });
      }

      // Create new tenant
      const newTenant: Omit<TenantRecord, 'id' | 'created_at' | 'updated_at'> = {
        name,
        domain,
        api_key: generateApiKey(),
        contentstack_config: contentstackConfig,
        widget_config: widgetConfig || {
          theme: 'default',
          position: 'bottom-right',
          primaryColor: '#007bff'
        },
        status: 'active',
        plan
      };

      const createdTenant = await dbService.createTenant(newTenant);

      console.log(`🏢 New tenant created: ${name} (${domain})`);

      res.status(201).json({
        tenant: {
          id: createdTenant.id,
          name: createdTenant.name,
          domain: createdTenant.domain,
          plan: createdTenant.plan,
          status: createdTenant.status,
          createdAt: createdTenant.created_at,
          widgetConfig: createdTenant.widget_config
        },
        apiKey: createdTenant.api_key,
        message: 'Tenant created successfully'
      });

    } catch (error) {
      console.error('❌ Tenant creation error:', error);
      res.status(500).json({
        error: 'Tenant creation failed',
        message: 'An error occurred while creating the tenant'
      });
    }
  }
);

// Get tenant by ID
router.get('/:tenantId',
  authMiddleware,
  param('tenantId').isUUID().withMessage('Valid tenant ID is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { tenantId } = req.params;

      // Mock tenant data (replace with actual database query)
      const mockTenant: TenantRecord = {
        id: tenantId,
        name: 'Demo Tenant',
        domain: 'demo.techsurf.com',
        api_key: 'ts_mock_api_key',
        contentstack_config: {
          apiKey: 'mock_cs_api_key',
          deliveryToken: 'mock_delivery_token',
          environment: 'production'
        },
        widget_config: {
          theme: 'default',
          position: 'bottom-right',
          primaryColor: '#007bff',
          welcomeMessage: 'Hello! How can I help you today?'
        },
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active',
        plan: 'pro'
      };

      res.json({
        tenant: {
          id: mockTenant.id,
          name: mockTenant.name,
          domain: mockTenant.domain,
          plan: mockTenant.plan,
          status: mockTenant.status,
          createdAt: mockTenant.created_at,
          updatedAt: mockTenant.updated_at,
          contentstackConfig: mockTenant.contentstack_config,
          widgetConfig: mockTenant.widget_config
        }
      });

    } catch (error) {
      console.error('❌ Get tenant error:', error);
      res.status(500).json({
        error: 'Failed to retrieve tenant',
        message: 'An error occurred while retrieving tenant information'
      });
    }
  }
);

// Update tenant
router.put('/:tenantId',
  authMiddleware,
  validateUpdateTenant,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { tenantId } = req.params;
      const { name, status, plan, contentstackConfig, widgetConfig } = req.body;

      // Mock update (replace with actual database update)
      const updatedTenant = {
        id: tenantId,
        name: name || 'Demo Tenant',
        domain: 'demo.techsurf.com',
        plan: plan || 'pro',
        status: status || 'active',
        updatedAt: new Date(),
        contentstackConfig,
        widgetConfig
      };

      console.log(`🏢 Tenant updated: ${tenantId}`, { name, status, plan });

      res.json({
        tenant: updatedTenant,
        message: 'Tenant updated successfully'
      });

    } catch (error) {
      console.error('❌ Tenant update error:', error);
      res.status(500).json({
        error: 'Tenant update failed',
        message: 'An error occurred while updating the tenant'
      });
    }
  }
);

// Get tenant configuration
router.get('/:tenantId/config',
  param('tenantId').isUUID().withMessage('Valid tenant ID is required'),
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // Mock configuration (replace with actual database query)
      const config = {
        widget: {
          theme: 'default',
          position: 'bottom-right',
          primaryColor: '#007bff',
          welcomeMessage: 'Hello! How can I help you today?',
          avatar: null,
          branding: {
            showPoweredBy: true,
            customLogo: null
          },
          features: {
            fileUpload: true,
            voiceMessages: false,
            typing_indicators: true,
            message_history: true
          },
          styling: {
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px'
          }
        },
        contentstack: {
          environment: 'production',
          locale: 'en-us',
          enableCache: true,
          cacheTTL: 300
        },
        ai: {
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are a helpful AI assistant for this website.'
        },
        security: {
          allowedOrigins: ['https://demo.techsurf.com'],
          rateLimit: {
            windowMs: 60000,
            maxRequests: 60
          }
        }
      };

      res.json({
        tenantId,
        config,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Get tenant config error:', error);
      res.status(500).json({
        error: 'Failed to retrieve tenant configuration',
        message: 'An error occurred while retrieving configuration'
      });
    }
  }
);

// Update tenant configuration
router.put('/:tenantId/config',
  authMiddleware,
  param('tenantId').isUUID().withMessage('Valid tenant ID is required'),
  body('config').isObject().withMessage('Configuration object is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { tenantId } = req.params;
      const { config } = req.body;

      // Validate configuration structure
      const validSections = ['widget', 'contentstack', 'ai', 'security'];
      const providedSections = Object.keys(config);
      const invalidSections = providedSections.filter(section => !validSections.includes(section));

      if (invalidSections.length > 0) {
        return res.status(400).json({
          error: 'Invalid configuration sections',
          invalidSections
        });
      }

      // Mock configuration update (replace with actual database update)
      console.log(`⚙️  Tenant config updated: ${tenantId}`, config);

      res.json({
        tenantId,
        config,
        lastUpdated: new Date().toISOString(),
        message: 'Configuration updated successfully'
      });

    } catch (error) {
      console.error('❌ Update tenant config error:', error);
      res.status(500).json({
        error: 'Configuration update failed',
        message: 'An error occurred while updating configuration'
      });
    }
  }
);

// Get tenant analytics
router.get('/:tenantId/analytics',
  authMiddleware,
  param('tenantId').isUUID().withMessage('Valid tenant ID is required'),
  [
    query('period').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid period'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { tenantId } = req.params;
      const { period = 'day', startDate, endDate } = req.query;

      // Mock analytics data (replace with actual database query)
      const analytics = {
        tenantId,
        period,
        dateRange: {
          start: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString()
        },
        metrics: {
          totalConversations: 156,
          totalMessages: 1247,
          averageSessionDuration: 425, // seconds
          resolvedQueries: 142,
          escalatedQueries: 14,
          userSatisfactionScore: 4.2,
          topQueries: [
            { query: 'product information', count: 34 },
            { query: 'pricing', count: 28 },
            { query: 'support', count: 22 },
            { query: 'features', count: 18 }
          ],
          responseTimeMetrics: {
            average: 1.2, // seconds
            p50: 0.8,
            p95: 3.1,
            p99: 5.7
          },
          contentAccess: {
            totalQueries: 89,
            successfulQueries: 76,
            failedQueries: 13,
            averageResultsReturned: 3.4
          }
        },
        trends: {
          conversationsGrowth: 12.5, // percentage
          messagesGrowth: 8.3,
          resolutionRateGrowth: -2.1
        }
      };

      res.json(analytics);

    } catch (error) {
      console.error('❌ Get tenant analytics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve analytics',
        message: 'An error occurred while retrieving analytics data'
      });
    }
  }
);

// Regenerate API key
router.post('/:tenantId/regenerate-key',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 5 }), // 5 regenerations per hour
  param('tenantId').isUUID().withMessage('Valid tenant ID is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { tenantId } = req.params;

      // Generate new API key
      const newApiKey = generateApiKey();

      // Mock key update (replace with actual database update)
      console.log(`🔑 API key regenerated for tenant: ${tenantId}`);

      res.json({
        apiKey: newApiKey,
        regeneratedAt: new Date().toISOString(),
        message: 'API key regenerated successfully. Please update your integration with the new key.'
      });

    } catch (error) {
      console.error('❌ API key regeneration error:', error);
      res.status(500).json({
        error: 'API key regeneration failed',
        message: 'An error occurred while regenerating API key'
      });
    }
  }
);

// Delete tenant (soft delete)
router.delete('/:tenantId',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 24 * 60 * 60 * 1000, max: 3 }), // 3 deletions per day
  param('tenantId').isUUID().withMessage('Valid tenant ID is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { tenantId } = req.params;

      // Mock soft delete (replace with actual database update)
      console.log(`🗑️  Tenant soft deleted: ${tenantId}`);

      res.json({
        tenantId,
        deletedAt: new Date().toISOString(),
        message: 'Tenant has been deactivated. Data will be retained for 30 days.'
      });

    } catch (error) {
      console.error('❌ Tenant deletion error:', error);
      res.status(500).json({
        error: 'Tenant deletion failed',
        message: 'An error occurred while deleting the tenant'
      });
    }
  }
);

export default router;
