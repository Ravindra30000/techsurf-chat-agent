import express from 'express';
import { body, validationResult } from 'express-validator';
import { LLMService } from '../services/llm-service.js';
import { ContentstackService } from '../services/contentstack-service.js';
import { CacheService } from '../services/cache-service.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateChatRequest = [
  body('messages').isArray().withMessage('Messages must be an array'),
  body('messages.*.content').notEmpty().withMessage('Message content is required'),
  body('messages.*.role').isIn(['user', 'assistant', 'system']).withMessage('Invalid message role'),
  body('provider').optional().isIn(['groq']).withMessage('Invalid provider'),
  body('model').optional().isString().withMessage('Model must be a string'),
  body('websiteContext').optional().isObject().withMessage('Website context must be an object'),
];

// Chat streaming endpoint
router.post('/stream', 
  rateLimitMiddleware({ windowMs: 60000, max: 60 }), // 60 requests per minute
  validateChatRequest,
  async (req, res) => {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.write(`data: ${JSON.stringify({ error: 'Validation failed', details: errors.array() })}\\n\\n`);
      res.end();
      return;
    }

    const { messages, provider = 'groq', model, websiteContext } = req.body;
    
    console.log('📨 Received chat request:', { 
      provider, 
      model, 
      messageCount: messages.length,
      hasContext: !!websiteContext 
    });

    try {
      // Get services from app locals
      const services = req.app.locals.services;
      if (!services?.llm) {
        throw new Error('LLM service not available');
      }

      const llmService: LLMService = services.llm;
      
      // Generate streaming response
      const stream = await llmService.generateStreamingResponse(
        messages,
        provider,
        model,
        websiteContext
      );

      // Handle the stream
      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices[0]) {
          const choice = chunk.choices[0];
          
          // Handle tool calls
          if (choice.delta.tool_calls) {
            console.log('🛠️ Processing tool calls:', choice.delta.tool_calls);
            
            for (const toolCall of choice.delta.tool_calls) {
              if (toolCall.function?.name === 'query_contentstack_content') {
                try {
                  const args = JSON.parse(toolCall.function.arguments || '{}');
                  console.log('🛠️ Processing Contentstack tool call:', args);
                  
                  // Use ContentstackService to fetch data
                  const contentstackService = new ContentstackService();
                  const results = await contentstackService.queryContent(
                    args.content_type,
                    args.query || '',
                    args.limit || 5
                  );
                  
                  console.log(`✅ Contentstack query returned ${results.length} entries`);
                  
                  // Send tool result back to client
                  const toolResponse = {
                    type: 'tool_result',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(results)
                  };
                  
                  res.write(`data: ${JSON.stringify(toolResponse)}\\n\\n`);
                  
                } catch (toolError) {
                  console.error('❌ Tool call error:', toolError);
                  const errorResponse = {
                    type: 'tool_error',
                    tool_call_id: toolCall.id,
                    error: toolError instanceof Error ? toolError.message : 'Unknown error'
                  };
                  res.write(`data: ${JSON.stringify(errorResponse)}\\n\\n`);
                }
              }
            }
          }
          
          // Handle regular content
          if (choice.delta.content) {
            const responseChunk = {
              type: 'content',
              content: choice.delta.content,
              finish_reason: choice.finish_reason
            };
            
            res.write(`data: ${JSON.stringify(responseChunk)}\\n\\n`);
          }
          
          // Handle completion
          if (choice.finish_reason) {
            const completionChunk = {
              type: 'completion',
              finish_reason: choice.finish_reason,
              usage: chunk.usage || null
            };
            
            res.write(`data: ${JSON.stringify(completionChunk)}\\n\\n`);
            break;
          }
        }
      }

    } catch (error) {
      console.error('❌ Chat streaming error:', error);
      
      const errorResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
      
      res.write(`data: ${JSON.stringify(errorResponse)}\\n\\n`);
    } finally {
      res.write('data: [DONE]\\n\\n');
      res.end();
    }
  }
);

// Non-streaming chat endpoint
router.post('/',
  rateLimitMiddleware({ windowMs: 60000, max: 30 }), // 30 requests per minute
  validateChatRequest,
  async (req, res) => {
    try {
      const { messages, provider = 'groq', model, websiteContext } = req.body;
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const services = req.app.locals.services;
      if (!services?.llm) {
        return res.status(503).json({ error: 'LLM service not available' });
      }

      const llmService: LLMService = services.llm;
      
      // For non-streaming, collect all chunks
      const stream = await llmService.generateStreamingResponse(
        messages,
        provider,
        model,
        websiteContext
      );

      let fullResponse = '';
      let usage = null;
      
      for await (const chunk of stream) {
        if (chunk.choices?.[0]?.delta?.content) {
          fullResponse += chunk.choices[0].delta.content;
        }
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }

      res.json({
        response: fullResponse,
        provider,
        model: model || 'llama-3.3-70b-versatile',
        usage,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Chat error:', error);
      res.status(500).json({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Get chat history
router.get('/history/:conversationId',
  authMiddleware,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const services = req.app.locals.services;
      if (!services?.database) {
        return res.status(503).json({ error: 'Database service not available' });
      }

      // This would fetch from your database
      // For now, return mock data
      const history = {
        conversationId,
        messages: [
          {
            id: 1,
            role: 'user',
            content: 'Hello, can you help me find products?',
            timestamp: new Date().toISOString(),
          },
          {
            id: 2,
            role: 'assistant',
            content: 'Of course! I can help you find products from our catalog. What are you looking for?',
            timestamp: new Date().toISOString(),
          }
        ],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: 2,
          hasMore: false
        }
      };

      res.json(history);

    } catch (error) {
      console.error('❌ History fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch chat history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get available models
router.get('/models', async (req, res) => {
  try {
    const services = req.app.locals.services;
    if (!services?.llm) {
      return res.status(503).json({ error: 'LLM service not available' });
    }

    const llmService: LLMService = services.llm;
    const providers = llmService.getAvailableProviders();

    res.json({
      providers,
      defaultProvider: 'groq',
      defaultModel: 'llama-3.3-70b-versatile',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Models fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch available models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate message content (for input sanitization)
router.post('/validate',
  body('content').notEmpty().isString().isLength({ min: 1, max: 10000 }),
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        valid: false,
        errors: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      valid: true,
      content: req.body.content.trim(),
      characterCount: req.body.content.length,
      timestamp: new Date().toISOString()
    });
  }
);

export default router;