import axios from 'axios';

export interface ContentstackConfig {
  apiKey: string;
  deliveryToken: string;
  environment?: string;
  region?: string;
  branch?: string;
}

export interface ContentstackEntry {
  uid: string;
  title: string;
  url?: string;
  content?: any;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface ContentstackResponse {
  entries: ContentstackEntry[];
  count: number;
  content_type_uid: string;
}

export class ContentstackService {
  private config: ContentstackConfig;
  private baseUrl: string;

  constructor(config?: ContentstackConfig) {
    this.config = config || this.getDefaultConfig();
    
    // Construct base URL based on region
    const region = this.config.region || 'us';
    if (region === 'eu') {
      this.baseUrl = 'https://eu-cdn.contentstack.io/v3';
    } else if (region === 'azure-na') {
      this.baseUrl = 'https://azure-na-cdn.contentstack.io/v3';
    } else if (region === 'azure-eu') {
      this.baseUrl = 'https://azure-eu-cdn.contentstack.io/v3';
    } else if (region === 'gcp-na') {
      this.baseUrl = 'https://gcp-na-cdn.contentstack.io/v3';
    } else {
      this.baseUrl = 'https://cdn.contentstack.io/v3';
    }

    console.log(`🏗️ Contentstack service initialized for region: ${region}`);
  }

  private getDefaultConfig(): ContentstackConfig {
    return {
      apiKey: process.env.CONTENTSTACK_API_KEY || '',
      deliveryToken: process.env.CONTENTSTACK_DELIVERY_TOKEN || '',
      environment: process.env.CONTENTSTACK_ENVIRONMENT || 'production',
      region: process.env.CONTENTSTACK_REGION || 'us',
      branch: process.env.CONTENTSTACK_BRANCH || 'main'
    };
  }

  private getHeaders() {
    return {
      'api_key': this.config.apiKey,
      'access_token': this.config.deliveryToken,
      'Content-Type': 'application/json',
      'branch': this.config.branch || 'main'
    };
  }

  // Query content with intelligent search
  public async queryContent(
    contentType: string,
    searchQuery: string = '',
    limit: number = 5
  ): Promise<ContentstackEntry[]> {
    try {
      console.log(`🔍 Querying Contentstack: ${contentType} with query "${searchQuery}"`);
      
      // Build query parameters
      const params: any = {
        environment: this.config.environment,
        locale: 'en-us',
        limit: Math.min(limit, 20), // Cap at 20 for performance
        include_count: true,
        include_fallback: true
      };

      // Add search parameters if query is provided
      if (searchQuery.trim()) {
        // Search in title and other text fields
        params.query = JSON.stringify({
          "$or": [
            { "title": { "$regex": searchQuery, "$options": "i" } },
            { "description": { "$regex": searchQuery, "$options": "i" } },
            { "content": { "$regex": searchQuery, "$options": "i" } },
            { "tags": { "$regex": searchQuery, "$options": "i" } }
          ]
        });
      }

      // Make API request
      const response = await axios.get(
        `${this.baseUrl}/content_types/${contentType}/entries`,
        {
          headers: this.getHeaders(),
          params,
          timeout: 10000
        }
      );

      if (response.data && response.data.entries) {
        console.log(`✅ Found ${response.data.entries.length} entries for "${contentType}"`);
        return response.data.entries;
      }

      console.log(`⚠️ No entries found for content type "${contentType}"`);
      return [];

    } catch (error) {
      console.error(`❌ Contentstack API error:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Contentstack authentication failed. Please check your API key and delivery token.');
        } else if (error.response?.status === 404) {
          throw new Error(`Content type "${contentType}" not found in Contentstack.`);
        } else if (error.response?.status === 429) {
          throw new Error('Contentstack API rate limit exceeded. Please try again later.');
        }
      }
      
      throw new Error(`Failed to query Contentstack content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get a specific entry by UID
  public async getEntry(contentType: string, uid: string): Promise<ContentstackEntry | null> {
    try {
      console.log(`📄 Fetching entry: ${contentType}/${uid}`);
      
      const response = await axios.get(
        `${this.baseUrl}/content_types/${contentType}/entries/${uid}`,
        {
          headers: this.getHeaders(),
          params: {
            environment: this.config.environment,
            locale: 'en-us'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.entry) {
        console.log(`✅ Retrieved entry: ${uid}`);
        return response.data.entry;
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to fetch entry ${uid}:`, error);
      throw new Error(`Failed to fetch entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all content types
  public async getContentTypes(): Promise<string[]> {
    try {
      console.log('📋 Fetching content types...');
      
      const response = await axios.get(
        `${this.baseUrl}/content_types`,
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      if (response.data && response.data.content_types) {
        const contentTypes = response.data.content_types.map((ct: any) => ct.uid);
        console.log(`✅ Found ${contentTypes.length} content types:`, contentTypes);
        return contentTypes;
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to fetch content types:', error);
      throw new Error(`Failed to fetch content types: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Smart content type detection based on query
  public detectContentType(query: string): string {
    const queryLower = query.toLowerCase();
    
    // Product-related queries
    if (queryLower.includes('product') || queryLower.includes('item') || 
        queryLower.includes('buy') || queryLower.includes('shop') ||
        queryLower.includes('price') || queryLower.includes('catalog')) {
      return 'product';
    }
    
    // Article/blog-related queries
    if (queryLower.includes('article') || queryLower.includes('blog') || 
        queryLower.includes('post') || queryLower.includes('guide') ||
        queryLower.includes('how to') || queryLower.includes('tutorial')) {
      return 'article';
    }
    
    // Event-related queries
    if (queryLower.includes('event') || queryLower.includes('webinar') || 
        queryLower.includes('conference') || queryLower.includes('meeting')) {
      return 'event';
    }
    
    // FAQ/support queries
    if (queryLower.includes('help') || queryLower.includes('support') || 
        queryLower.includes('faq') || queryLower.includes('question')) {
      return 'faq';
    }
    
    // Team/about queries
    if (queryLower.includes('team') || queryLower.includes('about') || 
        queryLower.includes('staff') || queryLower.includes('member')) {
      return 'team_member';
    }
    
    // Default to a generic content type
    return 'page';
  }

  // Format entries for AI consumption
  public formatEntriesForAI(entries: ContentstackEntry[]): string {
    if (!entries.length) {
      return 'No relevant content found in the CMS.';
    }

    return entries.map((entry, index) => {
      const title = entry.title || 'Untitled';
      const description = entry.description || entry.content || 'No description available';
      const url = entry.url || entry.href || '';
      
      return `${index + 1}. **${title}**${url ? ` (${url})` : ''}
${description.substring(0, 200)}${description.length > 200 ? '...' : ''}`;
    }).join('\n\n');
  }

  // Health check method
  public async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/content_types`,
        {
          headers: this.getHeaders(),
          params: { limit: 1 },
          timeout: 5000
        }
      );

      if (response.status === 200) {
        return {
          status: 'healthy',
          message: 'Contentstack API is accessible'
        };
      }

      return {
        status: 'unhealthy',
        message: 'Unexpected response from Contentstack API'
      };
    } catch (error) {
      console.error('Contentstack health check failed:', error);
      
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Validate configuration
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.apiKey) {
      errors.push('Missing Contentstack API key');
    }
    
    if (!this.config.deliveryToken) {
      errors.push('Missing Contentstack delivery token');
    }
    
    if (!this.config.environment) {
      errors.push('Missing Contentstack environment');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default ContentstackService;