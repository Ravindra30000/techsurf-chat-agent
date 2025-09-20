// # Contentstack Service Implementation

// ## File: `server/src/services/contentstack-service.ts`


import axios, { AxiosInstance } from 'axios';
import { CacheService } from './cache-service.js';

export interface ContentstackConfig {
  apiKey: string;
  deliveryToken: string;
  managementToken?: string;
  environment: string;
  region?: string;
  host?: string;
  cdnUrl?: string;
}

export interface ContentstackEntry {
  uid: string;
  title: string;
  url?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  locale: string;
  [key: string]: any;
}

export interface ContentstackResponse {
  entries: ContentstackEntry[];
  count: number;
  content_type_uid: string;
}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  include_count?: boolean;
  locale?: string;
  include_fallback?: boolean;
  include_metadata?: boolean;
}

export class ContentstackService {
  private deliveryApi: AxiosInstance;
  private managementApi?: AxiosInstance;
  private config: ContentstackConfig;
  private cacheService?: CacheService;
  private readonly CACHE_TTL = 5 * 60; // 5 minutes

  constructor(config?: Partial<ContentstackConfig>, cacheService?: CacheService) {
    this.config = {
      apiKey: config?.apiKey || process.env.CONTENTSTACK_API_KEY || '',
      deliveryToken: config?.deliveryToken || process.env.CONTENTSTACK_DELIVERY_TOKEN || '',
      managementToken: config?.managementToken || process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
      environment: config?.environment || process.env.CONTENTSTACK_ENVIRONMENT || 'production',
      region: config?.region || process.env.CONTENTSTACK_REGION || 'us',
      host: config?.host || process.env.CONTENTSTACK_API_HOST || 'cdn.contentstack.io',
      cdnUrl: config?.cdnUrl || process.env.CONTENTSTACK_CDN || 'cdn.contentstack.io'
    };

    this.cacheService = cacheService;

    // Initialize delivery API client
    this.deliveryApi = axios.create({
      baseURL: `https://${this.config.host}/v3`,
      headers: {
        'api_key': this.config.apiKey,
        'access_token': this.config.deliveryToken,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Initialize management API client if token is provided
    if (this.config.managementToken) {
      this.managementApi = axios.create({
        baseURL: `https://api.contentstack.io/v3`,
        headers: {
          'api_key': this.config.apiKey,
          'authorization': this.config.managementToken,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
    }

    console.log(`✅ ContentstackService initialized for environment: ${this.config.environment}`);
  }

  /**
   * Query content by content type with search functionality
   */
  public async queryContent(
    contentType: string,
    searchQuery?: string,
    limit: number = 10,
    options?: QueryOptions
  ): Promise<ContentstackEntry[]> {
    try {
      const cacheKey = `contentstack:${contentType}:${searchQuery || 'all'}:${limit}:${JSON.stringify(options)}`;
      
      // Try cache first
      if (this.cacheService) {
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
          console.log(`📦 Cache hit for Contentstack query: ${contentType}`);
          return JSON.parse(cached);
        }
      }

      console.log(`🔍 Querying Contentstack - Content Type: ${contentType}, Search: ${searchQuery || 'none'}`);

      // Build query parameters
      const params: any = {
        environment: this.config.environment,
        limit,
        include_count: options?.include_count ?? true,
        locale: options?.locale || 'en-us',
        include_fallback: options?.include_fallback ?? true,
        include_metadata: options?.include_metadata ?? false,
      };

      if (options?.skip) params.skip = options.skip;

      // Add search query if provided
      if (searchQuery && searchQuery.trim()) {
        // Search in title and other text fields
        params.query = JSON.stringify({
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
            { content: { $regex: searchQuery, $options: 'i' } },
            { tags: { $in: [searchQuery.toLowerCase()] } }
          ]
        });
      }

      const response = await this.deliveryApi.get(
        `/content_types/${contentType}/entries`,
        { params }
      );

      const entries = response.data.entries || [];
      console.log(`✅ Found ${entries.length} entries for ${contentType}`);

      // Cache the results
      if (this.cacheService && entries.length > 0) {
        await this.cacheService.set(cacheKey, JSON.stringify(entries), this.CACHE_TTL);
      }

      return entries;

    } catch (error) {
      console.error(`❌ Contentstack query error for ${contentType}:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn(`⚠️  Content type '${contentType}' not found`);
          return [];
        }
        if (error.response?.status === 401) {
          throw new Error('Contentstack authentication failed. Please check your API credentials.');
        }
      }
      
      throw new Error(`Failed to query Contentstack content: ${error}`);
    }
  }

  /**
   * Get a specific entry by UID
   */
  public async getEntry(
    contentType: string,
    uid: string,
    options?: QueryOptions
  ): Promise<ContentstackEntry | null> {
    try {
      const cacheKey = `contentstack:entry:${contentType}:${uid}`;
      
      if (this.cacheService) {
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const params: any = {
        environment: this.config.environment,
        locale: options?.locale || 'en-us',
        include_fallback: options?.include_fallback ?? true,
      };

      const response = await this.deliveryApi.get(
        `/content_types/${contentType}/entries/${uid}`,
        { params }
      );

      const entry = response.data.entry;
      
      if (this.cacheService && entry) {
        await this.cacheService.set(cacheKey, JSON.stringify(entry), this.CACHE_TTL);
      }

      return entry;

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error(`❌ Error fetching entry ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Search across multiple content types
   */
  public async globalSearch(
    searchQuery: string,
    contentTypes: string[] = ['product', 'article', 'page', 'faq'],
    limit: number = 5
  ): Promise<{ contentType: string; entries: ContentstackEntry[] }[]> {
    const results = await Promise.allSettled(
      contentTypes.map(async (contentType) => {
        const entries = await this.queryContent(contentType, searchQuery, limit);
        return { contentType, entries };
      })
    );

    return results
      .filter((result): result is PromiseFulfilledResult<{ contentType: string; entries: ContentstackEntry[] }> => 
        result.status === 'fulfilled')
      .map(result => result.value)
      .filter(result => result.entries.length > 0);
  }

  /**
   * Get all content types
   */
  public async getContentTypes(): Promise<any[]> {
    try {
      const response = await this.deliveryApi.get('/content_types', {
        params: { 
          environment: this.config.environment,
          include_count: true 
        }
      });

      return response.data.content_types || [];
    } catch (error) {
      console.error('❌ Error fetching content types:', error);
      return [];
    }
  }

  /**
   * Health check for Contentstack connectivity
   */
  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const response = await this.deliveryApi.get('/content_types', {
        params: { environment: this.config.environment, limit: 1 }
      });

      return {
        status: 'healthy',
        details: {
          environment: this.config.environment,
          contentTypes: response.data.count || 0,
          region: this.config.region
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          environment: this.config.environment
        }
      };
    }
  }

  /**
   * Smart content recommendation based on user query
   */
  public async recommendContent(
    userQuery: string,
    userContext?: any
  ): Promise<ContentstackEntry[]> {
    try {
      // Extract keywords from user query
      const keywords = this.extractKeywords(userQuery);
      
      // Search across different content types with different strategies
      const searchPromises = [
        // Direct search in products if query seems product-related
        this.isProductQuery(userQuery) ? 
          this.queryContent('product', userQuery, 3) : Promise.resolve([]),
        
        // Search in FAQs if query is a question
        this.isQuestionQuery(userQuery) ? 
          this.queryContent('faq', userQuery, 3) : Promise.resolve([]),
        
        // Search in articles/help docs
        this.queryContent('article', userQuery, 2),
        
        // Search in general pages
        this.queryContent('page', userQuery, 2)
      ];

      const results = await Promise.allSettled(searchPromises);
      
      const allEntries = results
        .filter((result): result is PromiseFulfilledResult<ContentstackEntry[]> => 
          result.status === 'fulfilled')
        .flatMap(result => result.value);

      // Remove duplicates and sort by relevance
      const uniqueEntries = this.deduplicateEntries(allEntries);
      
      return uniqueEntries.slice(0, 5); // Return top 5 most relevant

    } catch (error) {
      console.error('❌ Content recommendation error:', error);
      return [];
    }
  }

  private extractKeywords(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'].includes(word));
  }

  private isProductQuery(query: string): boolean {
    const productKeywords = ['buy', 'purchase', 'product', 'item', 'price', 'cost', 'order'];
    return productKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  private isQuestionQuery(query: string): boolean {
    const questionWords = ['how', 'what', 'why', 'when', 'where', 'who', 'can', 'do', 'does'];
    return questionWords.some(word => 
      query.toLowerCase().startsWith(word) ||
      query.includes('?')
    );
  }

  private deduplicateEntries(entries: ContentstackEntry[]): ContentstackEntry[] {
    const seen = new Set();
    return entries.filter(entry => {
      const key = `${entry.uid}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Get configuration info
   */
  public getConfig(): Omit<ContentstackConfig, 'deliveryToken' | 'managementToken'> {
    return {
      apiKey: this.config.apiKey ? '***' : '',
      environment: this.config.environment,
      region: this.config.region,
      host: this.config.host,
      cdnUrl: this.config.cdnUrl
    };
  }
}

export default ContentstackService;
