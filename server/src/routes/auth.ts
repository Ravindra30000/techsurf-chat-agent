import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { DatabaseService } from '../services/database-service.js';
import crypto from 'crypto';

const router = express.Router();

interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  iat: number;
  exp: number;
}

// JWT utility functions
const generateAccessToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  );
};

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('tenantId').optional().isUUID().withMessage('Invalid tenant ID format')
];

const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('tenantId').isUUID().withMessage('Valid tenant ID is required')
];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('tenantId').optional().isUUID().withMessage('Invalid tenant ID format')
];

// Login endpoint
router.post('/login',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 attempts per 15 minutes
  validateLogin,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password, tenantId } = req.body;

      // Get database service
      const services = req.app.locals.services;
      if (!services?.database) {
        return res.status(503).json({ error: 'Database service unavailable' });
      }

      const dbService: DatabaseService = services.database;

      // Mock user lookup (replace with actual database query)
      // const user = await dbService.getUserByEmail(email, tenantId);
      const mockUser: AuthUser = {
        id: crypto.randomUUID(),
        email,
        name: 'Demo User',
        tenantId: tenantId || 'default-tenant',
        role: 'admin',
        createdAt: new Date(),
        isActive: true
      };

      // Verify password (in production, compare with hashed password from database)
      const isValidPassword = await bcrypt.compare(password, await bcrypt.hash('password123', 10));
      
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      if (!mockUser.isActive) {
        return res.status(403).json({
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact support.'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(mockUser);
      const refreshToken = generateRefreshToken(mockUser);

      // Update last login (in production)
      // await dbService.updateUserLastLogin(mockUser.id);

      // Log successful login
      console.log(`✅ Successful login: ${email} (${mockUser.tenantId})`);

      res.json({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          tenantId: mockUser.tenantId
        },
        tokens: {
          accessToken,
          refreshToken
        },
        expiresIn: 900, // 15 minutes
        message: 'Login successful'
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  }
);

// Token refresh endpoint
router.post('/refresh',
  rateLimitMiddleware({ windowMs: 5 * 60 * 1000, max: 20 }), // 20 refreshes per 5 minutes
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'default-secret') as JWTPayload;

      // Mock user lookup
      const mockUser: AuthUser = {
        id: decoded.userId,
        email: 'user@example.com',
        name: 'Demo User',
        tenantId: decoded.tenantId,
        role: 'admin',
        createdAt: new Date(),
        isActive: true
      };

      // Generate new access token
      const newAccessToken = generateAccessToken(mockUser);

      res.json({
        accessToken: newAccessToken,
        expiresIn: 900, // 15 minutes
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          message: 'Please login again'
        });
      }

      console.error('❌ Token refresh error:', error);
      res.status(500).json({
        error: 'Token refresh failed',
        message: 'An error occurred while refreshing token'
      });
    }
  }
);

// Register endpoint (for tenant administrators)
router.post('/register',
  rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 5 }), // 5 registrations per hour
  validateRegister,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password, name, tenantId } = req.body;

      // Check if user already exists
      // const existingUser = await dbService.getUserByEmail(email, tenantId);
      // if (existingUser) {
      //   return res.status(409).json({
      //     error: 'User already exists',
      //     message: 'A user with this email already exists for this tenant'
      //   });
      // }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const newUser: AuthUser = {
        id: crypto.randomUUID(),
        email,
        name,
        tenantId,
        role: 'admin',
        createdAt: new Date(),
        isActive: true
      };

      // Save to database (mock for now)
      console.log('👤 New user registered:', { email, tenantId, name });

      // Generate tokens
      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          tenantId: newUser.tenantId
        },
        tokens: {
          accessToken,
          refreshToken
        },
        expiresIn: 900,
        message: 'Registration successful'
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  }
);

// Password reset request
router.post('/forgot-password',
  rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 3 }), // 3 requests per hour
  validatePasswordReset,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, tenantId } = req.body;

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to database (mock for now)
      console.log(`🔑 Password reset requested for: ${email}`, { resetToken, resetExpires });

      // In production, send reset email here
      // await emailService.sendPasswordResetEmail(email, resetToken);

      res.json({
        message: 'If an account with that email exists, we have sent password reset instructions.',
        // In production, don't include token in response
        resetToken // Only for testing
      });

    } catch (error) {
      console.error('❌ Forgot password error:', error);
      res.status(500).json({
        error: 'Password reset request failed',
        message: 'An error occurred while processing password reset request'
      });
    }
  }
);

// Password reset confirmation
router.post('/reset-password',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }),
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character')
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

      const { token, password } = req.body;

      // Verify reset token (mock for now)
      // const resetRecord = await dbService.getPasswordResetToken(token);
      // if (!resetRecord || resetRecord.expires < new Date()) {
      //   return res.status(400).json({
      //     error: 'Invalid or expired token'
      //   });
      // }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update user password (mock for now)
      console.log(`🔑 Password reset completed for token: ${token}`);

      res.json({
        message: 'Password has been reset successfully. Please login with your new password.'
      });

    } catch (error) {
      console.error('❌ Reset password error:', error);
      res.status(500).json({
        error: 'Password reset failed',
        message: 'An error occurred while resetting password'
      });
    }
  }
);

// Logout endpoint
router.post('/logout',
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      // Invalidate refresh token in database (mock for now)
      console.log(`👋 User logged out, token invalidated: ${refreshToken.slice(0, 20)}...`);

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }
);

// Validate token endpoint
router.get('/validate',
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          valid: false,
          error: 'No token provided'
        });
      }

      const token = authHeader.split(' ');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JWTPayload;

      res.json({
        valid: true,
        user: {
          userId: decoded.userId,
          email: decoded.email,
          tenantId: decoded.tenantId,
          role: decoded.role
        },
        expiresAt: new Date(decoded.exp * 1000)
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          valid: false,
          error: 'Invalid token'
        });
      }

      console.error('❌ Token validation error:', error);
      res.status(500).json({
        valid: false,
        error: 'Token validation failed'
      });
    }
  }
);

export default router;
