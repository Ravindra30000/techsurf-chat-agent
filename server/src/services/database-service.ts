// # Database Service Implementation

// ## File: `server/src/services/database-service.ts`


import { Pool, PoolClient, QueryResult } from 'pg';
import { createClient, RedisClientType } from 'redis';

export interface DatabaseConfig {
  url: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface ConversationRecord {
  id: string;
  tenant_id: string;
  user_id?: string;
  session_id: string;
  created_at: Date;
  updated_at: Date;
  metadata?: any;
  status: 'active' | 'closed' | 'archived';
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: Date;
  tokens_used?: number;
  model_used?: string;
}

export interface TenantRecord {
  id: string;
  name: string;
  domain: string;
  api_key: string;
  contentstack_config?: any;
  widget_config?: any;
  created_at: Date;
  updated_at: Date;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
}

export interface AnalyticsRecord {
  id: string;
  tenant_id: string;
  conversation_id?: string;
  event_type: string;
  event_data: any;
  created_at: Date;
  session_id?: string;
  user_id?: string;
}

export class DatabaseService {
  private pool: Pool;
  private config: DatabaseConfig;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = {
      maxConnections: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production',
      ...config
    };

    this.pool = new Pool({
      connectionString: this.config.url,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('❌ Unexpected database pool error:', err);
    });
  }

  public async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      console.log(`✅ Database connected successfully at ${result.rows[0].now}`);
      this.isConnected = true;
      
      // Initialize database schema
      await this.initializeSchema();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      console.log('✅ Database disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
    }
  }

  private async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Create tenants table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          domain VARCHAR(255) UNIQUE NOT NULL,
          api_key VARCHAR(255) UNIQUE NOT NULL,
          contentstack_config JSONB,
          widget_config JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
          plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise'))
        )
      `);

      // Create conversations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
          user_id VARCHAR(255),
          session_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived'))
        )
      `);

      // Create messages table
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          tokens_used INTEGER,
          model_used VARCHAR(100)
        )
      `);

      // Create analytics table
      await client.query(`
        CREATE TABLE IF NOT EXISTS analytics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
          conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
          event_type VARCHAR(100) NOT NULL,
          event_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          session_id VARCHAR(255),
          user_id VARCHAR(255)
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON conversations(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_analytics_tenant_id ON analytics(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
        CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
        CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);
      `);

      // Create updated_at trigger function
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      // Create triggers for updated_at
      await client.query(`
        DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
        CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
        CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('❌ Schema initialization failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Tenant operations
  public async createTenant(tenant: Omit<TenantRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TenantRecord> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO tenants (name, domain, api_key, contentstack_config, widget_config, status, plan)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [tenant.name, tenant.domain, tenant.api_key, tenant.contentstack_config, tenant.widget_config, tenant.status, tenant.plan]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  public async getTenantByApiKey(apiKey: string): Promise<TenantRecord | null> {
    const result = await this.pool.query('SELECT * FROM tenants WHERE api_key = $1', [apiKey]);
    return result.rows[0] || null;
  }

  public async getTenantByDomain(domain: string): Promise<TenantRecord | null> {
    const result = await this.pool.query('SELECT * FROM tenants WHERE domain = $1', [domain]);
    return result.rows[0] || null;
  }

  // Conversation operations
  public async createConversation(conversation: Omit<ConversationRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ConversationRecord> {
    const result = await this.pool.query(
      `INSERT INTO conversations (tenant_id, user_id, session_id, metadata, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [conversation.tenant_id, conversation.user_id, conversation.session_id, conversation.metadata, conversation.status]
    );
    return result.rows[0];
  }

  public async getConversation(id: string): Promise<ConversationRecord | null> {
    const result = await this.pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  public async getConversationsByTenant(tenantId: string, limit: number = 50, offset: number = 0): Promise<ConversationRecord[]> {
    const result = await this.pool.query(
      'SELECT * FROM conversations WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );
    return result.rows;
  }

  // Message operations
  public async createMessage(message: Omit<MessageRecord, 'id' | 'created_at'>): Promise<MessageRecord> {
    const result = await this.pool.query(
      `INSERT INTO messages (conversation_id, role, content, metadata, tokens_used, model_used)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [message.conversation_id, message.role, message.content, message.metadata, message.tokens_used, message.model_used]
    );
    return result.rows[0];
  }

  public async getMessagesByConversation(conversationId: string, limit: number = 50, offset: number = 0): Promise<MessageRecord[]> {
    const result = await this.pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3',
      [conversationId, limit, offset]
    );
    return result.rows;
  }

  // Analytics operations
  public async createAnalyticsEvent(event: Omit<AnalyticsRecord, 'id' | 'created_at'>): Promise<AnalyticsRecord> {
    const result = await this.pool.query(
      `INSERT INTO analytics (tenant_id, conversation_id, event_type, event_data, session_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [event.tenant_id, event.conversation_id, event.event_type, event.event_data, event.session_id, event.user_id]
    );
    return result.rows[0];
  }

  public async getAnalytics(
    tenantId: string,
    eventType?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<AnalyticsRecord[]> {
    let query = 'SELECT * FROM analytics WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (eventType) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // Utility methods
  public async query(text: string, params?: any[]): Promise<QueryResult> {
    return this.pool.query(text, params);
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW(), version()');
      client.release();

      return {
        status: 'healthy',
        details: {
          timestamp: result.rows[0].now,
          version: result.rows[0].version,
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingConnections: this.pool.waitingCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  // Transaction support
  public async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Statistics
  public async getStats(tenantId?: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const baseFilter = tenantId ? 'WHERE tenant_id = $1' : '';
      const params = tenantId ? [tenantId] : [];

      const [conversationsResult, messagesResult, analyticsResult] = await Promise.all([
        client.query(`SELECT COUNT(*) as total_conversations FROM conversations ${baseFilter}`, params),
        client.query(`SELECT COUNT(*) as total_messages FROM messages m JOIN conversations c ON m.conversation_id = c.id ${baseFilter}`, params),
        client.query(`SELECT COUNT(*) as total_events FROM analytics ${baseFilter}`, params)
      ]);

      return {
        totalConversations: parseInt(conversationsResult.rows[0].total_conversations),
        totalMessages: parseInt(messagesResult.rows[0].total_messages),
        totalEvents: parseInt(analyticsResult.rows[0].total_events),
        timestamp: new Date()
      };
    } finally {
      client.release();
    }
  }
}

export default DatabaseService;
