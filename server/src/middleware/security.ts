import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Security headers middleware
export const security = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), location=(), geolocation=()');
  
  // Remove server header
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'TechSurf-Platform');

  // Add request ID for tracing
  if (!req.headers['x-request-id']) {
    const requestId = crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
  }

  next();
};

// API Key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the x-api-key header'
    });
  }

  // TODO: Validate API key against database
  // For now, just check if it exists
  if (apiKey.length < 32) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  // Add to request for later use
  (req as any).apiKey = apiKey;
  next();
};

// Tenant validation middleware
export const validateTenant = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const apiKey = (req as any).apiKey;

  if (!tenantId) {
    return res.status(400).json({
      error: 'Tenant ID required',
      message: 'Please provide a tenant ID in the x-tenant-id header'
    });
  }

  try {
    // TODO: Validate tenant against database
    // const tenant = await databaseService.getTenantByApiKey(apiKey);
    // if (!tenant || tenant.id !== tenantId) {
    //   return res.status(403).json({
    //     error: 'Invalid tenant',
    //     message: 'The API key is not associated with the specified tenant'
    //   });
    // }

    // Mock tenant validation for now
    (req as any).tenant = {
      id: tenantId,
      name: 'Demo Tenant',
      status: 'active'
    };

    next();
  } catch (error) {
    console.error('Tenant validation error:', error);
    res.status(500).json({
      error: 'Tenant validation failed',
      message: 'Unable to validate tenant'
    });
  }
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = value.trim();
      }
    }
  }

  // Sanitize body content
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocols
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  }
}

// Request size limit middleware
export const requestSizeLimit = (maxSizeInMB: number = 10) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > maxSizeInMB * 1024 * 1024) {
      return res.status(413).json({
        error: 'Request too large',
        message: `Request size exceeds ${maxSizeInMB}MB limit`
      });
    }

    next();
  };
};

// CORS preflight handling
export const handleCORS = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-api-key,x-tenant-id,x-request-id');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(204).end();
  }

  next();
};

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message: message || `Too many requests from this IP, please try again after ${Math.ceil(windowMs / 60000)} minutes.`,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use API key if available, otherwise IP
      return (req as any).apiKey || req.ip;
    }
  });
};

// Specific rate limiters
export const strictRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const normalRateLimit = createRateLimit(15 * 60 * 1000, 1000); // 1000 requests per 15 minutes
export const lenientRateLimit = createRateLimit(15 * 60 * 1000, 5000); // 5000 requests per 15 minutes

// Content validation middleware
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type required',
        message: 'Please specify a Content-Type header'
      });
    }

    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
      });
    }

    next();
  };
};

// Security audit logging
export const securityAudit = (event: string, details?: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      event,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      tenantId: (req as any).tenant?.id,
      userId: (req as any).user?.id,
      requestId: req.headers['x-request-id'],
      details: details || {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode
      }
    };

    // In production, send to security monitoring service
    console.log('🔒 Security Audit:', JSON.stringify(auditLog));

    next();
  };
};

export default security;
