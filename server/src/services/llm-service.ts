import axios from 'axios';

export interface LLMProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface StreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
      tool_calls?: Array<{
        id?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService {
  private providers: Map<string, LLMProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Groq provider
    if (process.env.GROQ_API_KEY) {
      this.providers.set('groq', {
        name: 'Groq',
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1',
        models: [
          'llama-3.3-70b-versatile',
          'llama-3.1-70b-versatile',
          'llama-3.1-8b-instant',
          'mixtral-8x7b-32768',
          'gemma-7b-it'
        ]
      });
    }

    console.log(`✅ LLM Service initialized with ${this.providers.size} provider(s)`);
  }

  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  public async generateStreamingResponse(
    messages: ChatMessage[],
    provider: string = 'groq',
    model?: string,
    websiteContext?: any
  ): Promise<AsyncIterable<StreamChunk>> {
    const llmProvider = this.providers.get(provider);
    if (!llmProvider) {
      throw new Error(`Provider ${provider} not available`);
    }

    const selectedModel = model || llmProvider.models[0];
    console.log(`🤖 Generating response with ${provider}:${selectedModel}`);

    // Create tools for Contentstack integration
    const tools = [
      {
        type: 'function',
        function: {
          name: 'query_contentstack_content',
          description: 'Query content from Contentstack CMS when users ask about products, articles, or other content-specific information',
          parameters: {
            type: 'object',
            properties: {
              content_type: {
                type: 'string',
                description: 'The content type to query (e.g., "product", "article", "event")',
              },
              query: {
                type: 'string',
                description: 'Search query to find relevant content',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 5,
              },
            },
            required: ['content_type', 'query'],
          },
        },
      },
    ];

    // Enhanced system message with context awareness
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful AI assistant for a website. Your main job is to help users with their questions.

IMPORTANT DECISION MAKING:
- If users ask about specific content like products, articles, events, or anything that might be stored in a CMS, use the query_contentstack_content tool
- For general questions, conversations, or requests that don't need specific content data, respond directly without using tools
- Be smart about detecting when users want real information vs general chat

Website Context: ${websiteContext ? JSON.stringify(websiteContext) : 'Generic website'}

Examples of when to use tools:
- "Show me your products" → Use tool with content_type="product"
- "What's your return policy?" → Use tool with content_type="article", query="return policy"
- "Hello, how are you?" → Respond directly, no tool needed
- "What's the weather like?" → Respond directly, no tool needed

Always be helpful, friendly, and provide accurate information based on the tools available.`
    };

    const requestBody = {
      model: selectedModel,
      messages: [systemMessage, ...messages],
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    };

    try {
      const response = await axios.post(
        `${llmProvider.baseUrl}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${llmProvider.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );

      return this.parseStreamResponse(response.data);
    } catch (error) {
      console.error('❌ LLM API Error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate response'
      );
    }
  }

  private async *parseStreamResponse(stream: any): AsyncIterable<StreamChunk> {
    return new Promise<AsyncIterable<StreamChunk>>((resolve, reject) => {
      const iterator = this.createStreamIterator(stream);
      resolve(iterator);
    });
  }

  private async *createStreamIterator(stream: any): AsyncIterable<StreamChunk> {
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      
      // Split by newlines to process complete messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            yield parsed as StreamChunk;
          } catch (error) {
            console.warn('Failed to parse stream chunk:', data);
            continue;
          }
        }
      }
    }
  }

  // Non-streaming version for simple use cases
  public async generateResponse(
    messages: ChatMessage[],
    provider: string = 'groq',
    model?: string,
    websiteContext?: any
  ): Promise<string> {
    let fullResponse = '';
    
    const stream = await this.generateStreamingResponse(messages, provider, model, websiteContext);
    
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
      }
    }
    
    return fullResponse;
  }

  // Health check method
  public async healthCheck(): Promise<{ [provider: string]: boolean }> {
    const results: { [provider: string]: boolean } = {};
    
    for (const [name, provider] of this.providers) {
      try {
        const response = await axios.get(`${provider.baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
          },
          timeout: 5000,
        });
        
        results[name] = response.status === 200;
      } catch (error) {
        console.error(`Health check failed for ${name}:`, error);
        results[name] = false;
      }
    }
    
    return results;
  }

  // Get model information
  public getModelInfo(provider: string = 'groq'): { models: string[]; default: string } | null {
    const llmProvider = this.providers.get(provider);
    if (!llmProvider) return null;
    
    return {
      models: llmProvider.models,
      default: llmProvider.models[0],
    };
  }

  // Validate API keys on startup
  public async validateProviders(): Promise<void> {
    console.log('🔍 Validating LLM providers...');
    
    const healthResults = await this.healthCheck();
    
    for (const [provider, isHealthy] of Object.entries(healthResults)) {
      if (isHealthy) {
        console.log(`✅ ${provider} provider is healthy`);
      } else {
        console.warn(`⚠️  ${provider} provider health check failed`);
      }
    }
  }
}

export default LLMService;