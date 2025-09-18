import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';

export interface RateLimitConfig {
  windowMs?: number;
  max?: number;
  message?: string | object;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  skip?: (req: Request) => boolean;
}

// Default rate limit configuration
const defaultConfig: Required<RateLimitConfig> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the maximum number of requests allowed. Please try again later.',
    retryAfter: '15 minutes'
  },
  statusCode: 429,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => false
};

// Create rate limit middleware with custom configuration
export const rateLimitMiddleware = (config: RateLimitConfig = {}): RateLimitRequestHandler => {
  const finalConfig = { ...defaultConfig, ...config };

  return rateLimit({
    windowMs: finalConfig.windowMs,
    max: finalConfig.max,
    message: finalConfig.message,
    statusCode: finalConfig.statusCode,
    skipSuccessfulRequests: finalConfig.skipSuccessfulRequests,
    skipFailedRequests: finalConfig.skipFailedRequests,
    skip: finalConfig.skip,
    
    // Custom headers
    standardHeaders: true,
    legacyHeaders: false,
    
    // Custom handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
      console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      
      res.status(finalConfig.statusCode).json({
        ...finalConfig.message,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        path: req.path
      });
    },
    
    // Key generator (by default uses IP)
    keyGenerator: (req: Request) => {
      // You can customize this to use different keys
      // For example, by user ID if authenticated
      return req.ip;
    },
    
    // Store (uses memory by default, can be replaced with Redis for distributed systems)
    // store: new RedisStore({ ... }) // Enable this for production with Redis
  });
};

// Predefined rate limiters for different use cases
export const strictRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Very strict: 20 requests per 15 minutes
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests from this IP. Please wait 15 minutes before trying again.',
    retryAfter: '15 minutes'
  }
});

export const moderateRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Moderate: 100 requests per 15 minutes
  message: {
    error: 'Rate limit exceeded',
    message: 'You have made too many requests. Please wait before trying again.',
    retryAfter: '15 minutes'
  }
});

export const lenientRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Lenient: 300 requests per 15 minutes
  message: {
    error: 'Rate limit exceeded',
    message: 'Request limit reached. Please try again in a few minutes.',
    retryAfter: '15 minutes'
  }
});

// API-specific rate limiters
export const chatRateLimit = rateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 chat requests per minute
  message: {
    error: 'Chat rate limit exceeded',
    message: 'Too many chat requests. Please wait a moment before sending another message.',
    retryAfter: '1 minute'
  }
});

export const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 authentication attempts per 15 minutes
  message: {
    error: 'Authentication rate limit exceeded',
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

export const widgetRateLimit = rateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 widget requests per minute (higher for widget loads)
  message: {
    error: 'Widget rate limit exceeded',
    message: 'Too many widget requests. Please refresh the page in a moment.',
    retryAfter: '1 minute'
  }
});

export const uploadRateLimit = rateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    error: 'Upload rate limit exceeded',
    message: 'Too many file uploads. Please wait an hour before uploading again.',
    retryAfter: '1 hour'
  }
});

// Development rate limit (very lenient for testing)
export const developmentRateLimit = rateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute (very lenient)
  skip: () => process.env.NODE_ENV !== 'development' // Only skip in development
});

export default rateLimitMiddleware;