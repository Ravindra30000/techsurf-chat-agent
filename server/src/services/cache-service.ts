// # Cache Service Implementation

// ## File: `server/src/services/cache-service.ts`


import Redis, { Redis as RedisClient } from 'ioredis';

export interface CacheConfig {
  url: string;
  keyPrefix?: string;
  defaultTTL?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

export interface CacheStats {
  memoryUsage: string;
  connectedClients: number;
  totalConnectionsReceived: string;
  totalCommandsProcessed: string;
  uptime: string;
}

export class CacheService {
  private client: RedisClient;
  private config: CacheConfig;
  private isConnected: boolean = false;
  private readonly DEFAULT_TTL = 3600; // 1 hour

  constructor(config: CacheConfig) {
    this.config = {
      keyPrefix: 'techsurf:',
      defaultTTL: this.DEFAULT_TTL,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      ...config
    };

    // Initialize Redis client
    this.client = new Redis(this.config.url, {
      keyPrefix: this.config.keyPrefix,
      retryDelayOnFailover: this.config.retryDelayOnFailover,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      lazyConnect: true,
      // Connection retry options
      retryDelayOnClusterDown: 300,
      retryDelayOnDisconnect: 100,
      maxRetriesPerRequest: 3,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('🟢 Redis connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('✅ Redis ready to accept commands');
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('🔴 Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('✅ Cache service connected to Redis');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw new Error(`Redis connection failed: ${error}`);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      console.log('✅ Cache service disconnected from Redis');
    } catch (error) {
      console.error('❌ Error disconnecting from Redis:', error);
    }
  }

  // Basic cache operations
  public async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      if (value) {
        console.log(`📦 Cache hit: ${key}`);
      }
      return value;
    } catch (error) {
      console.error(`❌ Cache get error for key ${key}:`, error);
      return null; // Graceful degradation
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      const expiry = ttl || this.config.defaultTTL!;
      await this.client.setex(key, expiry, value);
      console.log(`💾 Cache set: ${key} (TTL: ${expiry}s)`);
      return true;
    } catch (error) {
      console.error(`❌ Cache set error for key ${key}:`, error);
      return false;
    }
  }

  public async del(key: string | string[]): Promise<number> {
    try {
      const deleted = await this.client.del(key);
      console.log(`🗑️ Cache deleted: ${Array.isArray(key) ? key.join(', ') : key} (${deleted} keys)`);
      return deleted;
    } catch (error) {
      console.error(`❌ Cache delete error:`, error);
      return 0;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`❌ Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error(`❌ Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`❌ Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  // Advanced operations
  public async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.client.mget(...keys);
    } catch (error) {
      console.error(`❌ Cache mget error:`, error);
      return new Array(keys.length).fill(null);
    }
  }

  public async mset(keyValues: { [key: string]: string }, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();
      
      for (const [key, value] of Object.entries(keyValues)) {
        if (ttl) {
          pipeline.setex(key, ttl, value);
        } else {
          pipeline.set(key, value);
        }
      }
      
      await pipeline.exec();
      console.log(`💾 Cache mset: ${Object.keys(keyValues).length} keys`);
      return true;
    } catch (error) {
      console.error(`❌ Cache mset error:`, error);
      return false;
    }
  }

  // Hash operations
  public async hget(hash: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(hash, field);
    } catch (error) {
      console.error(`❌ Cache hget error for ${hash}.${field}:`, error);
      return null;
    }
  }

  public async hset(hash: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hset(hash, field, value);
      return true;
    } catch (error) {
      console.error(`❌ Cache hset error for ${hash}.${field}:`, error);
      return false;
    }
  }

  public async hgetall(hash: string): Promise<{ [key: string]: string }> {
    try {
      return await this.client.hgetall(hash);
    } catch (error) {
      console.error(`❌ Cache hgetall error for ${hash}:`, error);
      return {};
    }
  }

  public async hdel(hash: string, ...fields: string[]): Promise<number> {
    try {
      return await this.client.hdel(hash, ...fields);
    } catch (error) {
      console.error(`❌ Cache hdel error for ${hash}:`, error);
      return 0;
    }
  }

  // List operations
  public async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lpush(key, ...values);
    } catch (error) {
      console.error(`❌ Cache lpush error for ${key}:`, error);
      return 0;
    }
  }

  public async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rpush(key, ...values);
    } catch (error) {
      console.error(`❌ Cache rpush error for ${key}:`, error);
      return 0;
    }
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      console.error(`❌ Cache lrange error for ${key}:`, error);
      return [];
    }
  }

  public async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    try {
      await this.client.ltrim(key, start, stop);
      return true;
    } catch (error) {
      console.error(`❌ Cache ltrim error for ${key}:`, error);
      return false;
    }
  }

  // Set operations
  public async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      console.error(`❌ Cache sadd error for ${key}:`, error);
      return 0;
    }
  }

  public async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      console.error(`❌ Cache smembers error for ${key}:`, error);
      return [];
    }
  }

  public async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      console.error(`❌ Cache sismember error for ${key}:`, error);
      return false;
    }
  }

  public async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.srem(key, ...members);
    } catch (error) {
      console.error(`❌ Cache srem error for ${key}:`, error);
      return 0;
    }
  }

  // Pattern operations
  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`❌ Cache keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  public async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error(`❌ Cache deleteByPattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Utility methods for common caching patterns
  public async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number,
    serialize?: (data: T) => string,
    deserialize?: (data: string) => T
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      
      if (cached !== null) {
        return deserialize ? deserialize(cached) : JSON.parse(cached);
      }

      // If not in cache, fetch the data
      console.log(`🔄 Cache miss for ${key}, fetching fresh data`);
      const freshData = await fetchFunction();
      
      // Store in cache for future use
      const serialized = serialize ? serialize(freshData) : JSON.stringify(freshData);
      await this.set(key, serialized, ttl);
      
      return freshData;
    } catch (error) {
      console.error(`❌ Cache getOrSet error for key ${key}:`, error);
      // Fallback to fetch function if cache fails
      return await fetchFunction();
    }
  }

  // Session storage
  public async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<boolean> {
    const sessionKey = `session:${sessionId}`;
    return await this.set(sessionKey, JSON.stringify(data), ttl);
  }

  public async getSession(sessionId: string): Promise<any | null> {
    const sessionKey = `session:${sessionId}`;
    const data = await this.get(sessionKey);
    return data ? JSON.parse(data) : null;
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    const sessionKey = `session:${sessionId}`;
    const deleted = await this.del(sessionKey);
    return deleted > 0;
  }

  // Rate limiting support
  public async incrementRateLimit(key: string, window: number = 3600): Promise<number> {
    try {
      const pipeline = this.client.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, window);
      const results = await pipeline.exec();
      
      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      console.error(`❌ Rate limit increment error for ${key}:`, error);
      return 0;
    }
  }

  // Health check and stats
  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const ping = await this.client.ping();
      const info = await this.client.info('memory');
      
      if (ping === 'PONG') {
        return {
          status: 'healthy',
          details: {
            connected: this.isConnected,
            ping: ping,
            memoryInfo: info,
            keyPrefix: this.config.keyPrefix
          }
        };
      } else {
        return {
          status: 'unhealthy',
          details: { ping, connected: this.isConnected }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          connected: this.isConnected 
        }
      };
    }
  }

  public async getStats(): Promise<CacheStats> {
    try {
      const info = await this.client.info();
      const infoLines = info.split('\r\n');
      const stats: any = {};
      
      infoLines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });

      return {
        memoryUsage: stats.used_memory_human || 'unknown',
        connectedClients: parseInt(stats.connected_clients) || 0,
        totalConnectionsReceived: stats.total_connections_received || '0',
        totalCommandsProcessed: stats.total_commands_processed || '0',
        uptime: stats.uptime_in_seconds ? `${Math.floor(parseInt(stats.uptime_in_seconds) / 3600)}h` : '0h'
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return {
        memoryUsage: 'unknown',
        connectedClients: 0,
        totalConnectionsReceived: '0',
        totalCommandsProcessed: '0',
        uptime: '0h'
      };
    }
  }

  // Cleanup methods
  public async flushAll(): Promise<boolean> {
    try {
      await this.client.flushall();
      console.log('🧹 Cache flushed all data');
      return true;
    } catch (error) {
      console.error('❌ Error flushing cache:', error);
      return false;
    }
  }

  public async flushDb(): Promise<boolean> {
    try {
      await this.client.flushdb();
      console.log('🧹 Cache flushed current database');
      return true;
    } catch (error) {
      console.error('❌ Error flushing database:', error);
      return false;
    }
  }

  // Get raw Redis client for advanced operations
  public getClient(): RedisClient {
    return this.client;
  }

  public isReady(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }
}

export default CacheService;
