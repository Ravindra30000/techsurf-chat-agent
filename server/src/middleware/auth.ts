import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';

export interface AuthUser {
  id: string;
  tenantId?: string;
  email?: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  tenant?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');
    const apiKey = req.header('x-api-key');
    
    // Check for API key authentication (for widget usage)
    if (apiKey) {
      validateApiKey(apiKey, req, next);
      return;
    }
    
    // Check for JWT authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No valid authentication provided.', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

// API key validation for widget access
const validateApiKey = async (apiKey: string, req: AuthRequest, next: NextFunction) => {
  try {
    // In a real implementation, you would:
    // 1. Hash the API key and look it up in the database
    // 2. Get the associated tenant information
    // 3. Set req.tenant with the tenant data
    
    // For now, we'll do a simple validation
    if (!apiKey || apiKey.length < 10) {
      throw new AppError('Invalid API key', 401);
    }
    
    // Mock tenant data (replace with database lookup)
    req.tenant = {
      id: 'tenant_' + apiKey.substring(0, 8),
      apiKey: apiKey,
      name: 'Demo Tenant',
      plan: 'free',
      isActive: true
    };
    
    console.log(`🔑 API key authenticated for tenant: ${req.tenant.id}`);
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (doesn't fail if no auth provided)
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');
    const apiKey = req.header('x-api-key');
    
    if (apiKey) {
      validateApiKey(apiKey, req, next);
      return;
    }
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
          req.user = {
            id: decoded.id,
            tenantId: decoded.tenantId,
            email: decoded.email,
            role: decoded.role
          };
        } catch (error) {
          // Invalid token, but we don't fail - just continue without user
          console.warn('⚠️ Invalid token provided, continuing without authentication');
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization
export const requireRole = (requiredRoles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      throw new AppError(`Access denied. Required role: ${roles.join(' or ')}`, 403);
    }
    
    next();
  };
};

// Tenant isolation middleware
export const requireTenant = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const tenantId = req.header('x-tenant-id') || req.user?.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    throw new AppError('Tenant ID required', 400);
  }
  
  // Attach tenant ID to request for use in other middleware/routes
  req.tenantId = tenantId;
  
  next();
};

// Generate JWT token
export const generateToken = (payload: object, expiresIn: string = '7d'): string => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT secret not configured', 500);
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify token utility
export const verifyToken = (token: string): any => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT secret not configured', 500);
  }
  
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Generate API key
export const generateApiKey = (): string => {
  const prefix = 'tsk'; // TechSurf Key
  const randomBytes = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  
  return `${prefix}_${timestamp}_${randomBytes}`;
};

// Middleware to extract tenant context
export const extractTenantContext = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Try to get tenant info from various sources
  const tenantId = req.header('x-tenant-id') || 
                  req.query.tenant as string || 
                  req.user?.tenantId || 
                  req.tenant?.id;
  
  if (tenantId) {
    req.tenantId = tenantId;
  }
  
  // Extract website domain for context
  const domain = req.header('x-website-domain') || 
                req.header('referer') || 
                req.header('origin');
  
  if (domain) {
    req.websiteDomain = domain;
  }
  
  next();
};

export default authMiddleware;