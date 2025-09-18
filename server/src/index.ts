import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import chatRoutes from './routes/chat.js';
import widgetRoutes from './routes/widget.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenant.js';

// Import services
import { LLMService } from './services/llm-service.js';
import { CacheService } from './services/cache-service.js';
import { DatabaseService } from './services/database-service.js';

// Import middleware
import { errorHandler } from './middleware/error-handler.js';
import { logger } from './middleware/logger.js';
import { metrics } from './middleware/metrics.js';
import { security } from './middleware/security.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ================================
// GLOBAL MIDDLEWARE
// ================================

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for widget injection
        'https://api.groq.com',
        'https://cdn.contentstack.io'
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        'https://api.groq.com',
        'https://cdn.contentstack.io'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https://images.contentstack.io'
      ]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

if (NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// Basic middleware
app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(logger);
app.use(metrics);
app.use(security);

// ================================
// SERVICES INITIALIZATION
// ================================

let services: {
  llm: LLMService;
  cache: CacheService;
  database: DatabaseService;
} | null = null;

async function initializeServices() {
  console.log('🔧 Initializing services...');
  
  try {
    // Initialize cache service
    const cacheService = new CacheService({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await cacheService.connect();
    console.log('✅ Cache service initialized');

    // Initialize database service
    const databaseService = new DatabaseService({
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/techsurf_dev',
    });
    await databaseService.connect();
    console.log('✅ Database service initialized');

    // Initialize LLM service
    const llmService = new LLMService();
    console.log('✅ LLM service initialized');

    services = {
      llm: llmService,
      cache: cacheService,
      database: databaseService,
    };

    // Make services available to routes
    app.locals.services = services;
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    // Don't exit in development, use fallback services
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// ================================
// ROUTES
// ================================

// Health check (before other routes)
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      llm: services?.llm ? 'healthy' : 'unavailable',
      cache: services?.cache ? 'healthy' : 'unavailable',
      database: services?.database ? 'healthy' : 'unavailable',
    },
    memory: process.memoryUsage(),
    features: [
      'Groq AI integration',
      'Smart tool calling',
      'Contentstack REST API',
      'Real-time streaming',
      'Multi-tenant support'
    ]
  };

  res.json(health);
});

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);

// Widget serving (for direct CDN access)
app.get('/widget/v1/universal-chat.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  
  // In production, this would serve the actual built SDK file
  // For now, return a simple script
  const widgetScript = `
(function() {
  console.log('TechSurf Universal Chat Widget v1.0.0');
  console.log('🚀 Loading from: ${req.get('host')}/widget/v1/');
  
  window.TechSurfChat = {
    init: function(config) {
      console.log('✅ TechSurf Chat Widget initialized with config:', config);
      // Widget initialization logic would go here
    }
  };
})();
`;
  
  res.send(widgetScript);
});

// Documentation routes
app.get('/docs', (req, res) => {
  res.json({
    message: 'TechSurf Chat Platform API Documentation',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      widget: '/api/widget',
      analytics: '/api/analytics',
      auth: '/api/auth',
      tenant: '/api/tenant'
    },
    docs: {
      interactive: '/docs/swagger',
      postman: '/docs/postman.json'
    }
  });
});

// Catch-all for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.path,
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: [
      'GET /health',
      'POST /api/chat/stream',
      'GET /api/widget/config',
      'GET /widget/v1/universal-chat.js'
    ]
  });
});

// ================================
// ERROR HANDLING
// ================================

app.use(errorHandler);

// ================================
// SOCKET.IO SETUP
// ================================

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join_tenant', (tenantId: string) => {
    socket.join(`tenant_${tenantId}`);
    console.log(`🏢 Socket ${socket.id} joined tenant: ${tenantId}`);
  });

  socket.on('chat_message', async (data) => {
    try {
      // Broadcast typing indicator
      socket.to(`tenant_${data.tenantId}`).emit('typing', {
        conversationId: data.conversationId,
        isTyping: true
      });

      // Process message (this would integrate with your LLM service)
      // For now, just echo back
      setTimeout(() => {
        socket.to(`tenant_${data.tenantId}`).emit('chat_response', {
          conversationId: data.conversationId,
          response: `Echo: ${data.message}`,
          timestamp: new Date().toISOString()
        });
      }, 1000);

    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ================================
// SERVER STARTUP
// ================================

async function startServer() {
  try {
    // Initialize services
    await initializeServices();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 TechSurf Chat Server running on http://localhost:${PORT}`);
      console.log(`📚 Environment: ${NODE_ENV}`);
      console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📖 API docs: http://localhost:${PORT}/docs`);
      console.log(`🔌 Socket.IO enabled for real-time features`);
      console.log('✅ Server startup complete');
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// ================================
// GRACEFUL SHUTDOWN
// ================================

const gracefulShutdown = async (signal: string) => {
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    console.log('🔒 HTTP server closed');

    try {
      // Close database connections
      if (services?.database) {
        await services.database.disconnect();
        console.log('🗄️ Database connections closed');
      }

      // Close Redis connections
      if (services?.cache) {
        await services.cache.disconnect();
        console.log('⚡ Cache connections closed');
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⏰ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();

export default app;