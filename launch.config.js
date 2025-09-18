// launch.config.js - Contentstack Launch Configuration
module.exports = {
  // Project identification
  name: 'techsurf-chat-platform',
  description: 'Universal AI-powered chat widget platform',
  
  // Build configuration
  build: {
    command: 'npm run build:production',
    outputDir: 'dist',
    installCommand: 'npm ci',
    environment: {
      NODE_ENV: 'production',
      REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'https://api.techsurf-chat.launch.contentstack.com',
      REACT_APP_CDN_URL: process.env.REACT_APP_CDN_URL || 'https://cdn.techsurf-chat.launch.contentstack.com',
      REACT_APP_WIDGET_URL: process.env.REACT_APP_WIDGET_URL || 'https://widget.techsurf-chat.launch.contentstack.com'
    }
  },
  
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    routes: [
      // API routes (server-side)
      {
        src: '/api/(.*)',
        dest: '/server/dist/index.js'
      },
      
      // Widget SDK (static with CORS headers)
      {
        src: '/widget/v1/universal-chat.js',
        dest: '/sdk/dist/index.umd.js',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Type': 'application/javascript'
        }
      },
      
      // Widget CSS
      {
        src: '/widget/v1/styles.css',
        dest: '/sdk/dist/styles.css',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Type': 'text/css'
        }
      },
      
      // Static assets
      {
        src: '/static/(.*)',
        dest: '/client/build/static/$1',
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      
      // Health check endpoint
      {
        src: '/health',
        dest: '/server/dist/index.js'
      },
      
      // Admin dashboard (protected)
      {
        src: '/admin/(.*)',
        dest: '/client/build/index.html',
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      },
      
      // Main app (SPA fallback)
      {
        src: '/(.*)',
        dest: '/client/build/index.html'
      }
    ],
    
    // Headers for all routes
    headers: [
      {
        src: '/api/(.*)',
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    ]
  },
  
  // Functions configuration (for serverless)
  functions: {
    'server/dist/functions/*.js': {
      runtime: 'nodejs18.x',
      memory: 512,
      timeout: 30,
      environment: {
        NODE_ENV: 'production'
      }
    }
  },
  
  // Environment variables
  env: {
    // Auto-injected by Launch
    CONTENTSTACK_API_HOST: 'cdn.contentstack.io',
    CONTENTSTACK_CDN: 'cdn.contentstack.io',
    CONTENTSTACK_REGION: process.env.CONTENTSTACK_REGION || 'us',
    
    // Custom environment variables
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX_REQUESTS: '1000',
    LOG_LEVEL: 'info'
  },
  
  // Redirects
  redirects: [
    {
      source: '/docs',
      destination: '/docs/getting-started',
      permanent: true
    },
    {
      source: '/widget',
      destination: '/widget/v1/universal-chat.js',
      permanent: false
    }
  ],
  
  // Rewrites for API versioning
  rewrites: [
    {
      source: '/v1/api/:path*',
      destination: '/api/:path*'
    }
  ],
  
  // Custom domains configuration
  domains: [
    'techsurf-chat.ai',
    'api.techsurf-chat.ai',
    'widget.techsurf-chat.ai',
    'cdn.techsurf-chat.ai'
  ],
  
  // Performance optimizations
  performance: {
    // Enable compression
    compress: true,
    
    // Enable HTTP/2 Server Push
    http2Push: [
      '/widget/v1/universal-chat.js',
      '/widget/v1/styles.css'
    ],
    
    // Preload critical resources
    preload: [
      {
        href: '/widget/v1/universal-chat.js',
        as: 'script',
        crossorigin: 'anonymous'
      }
    ]
  },
  
  // Security configuration
  security: {
    // Content Security Policy
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for widget injection
        'https://api.groq.com',
        'https://cdn.contentstack.io'
      ],
      'style-src': [
        "'self'", 
        "'unsafe-inline'"
      ],
      'connect-src': [
        "'self'",
        'https://api.groq.com',
        'https://cdn.contentstack.io',
        'wss://*.techsurf-chat.ai' // WebSocket for real-time features
      ],
      'img-src': [
        "'self'",
        'data:',
        'https://images.contentstack.io'
      ],
      'font-src': [
        "'self'",
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ]
    },
    
    // Security headers
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  
  // Monitoring and analytics
  monitoring: {
    // Enable Launch built-in monitoring
    enabled: true,
    
    // Custom metrics
    metrics: [
      'chat_conversations_total',
      'widget_loads_total',
      'contentstack_api_calls_total',
      'groq_api_calls_total'
    ]
  },
  
  // Cache configuration
  cache: {
    // Static assets
    static: {
      maxAge: 31536000, // 1 year
      immutable: true
    },
    
    // API responses
    api: {
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 60
    }
  },
  
  // Development settings
  dev: {
    port: 3000,
    open: true,
    overlay: true
  }
};