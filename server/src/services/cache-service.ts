import Redis from 'ioredis';

export interface CacheOptions {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

export class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;
  private keyPrefix: string;

  constructor(options: CacheOptions = {}) {
    this.keyPrefix = options.keyPrefix || 'techsurf:';
    
    // Initialize Redis connection
    if (options.url) {
      this.redis = new Redis(options.url, {
        retryDelayOnFailover: options.retryDelayOnFailover || 100,
        maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
        lazyConnect: true,
      });
    } else {
      this.redis = new Redis({
        host: options.host || 'localhost',
        port: options.port || 6379,
        password: options.password,
        db: options.db || 0,
        retryDelayOnFailover: options.retryDelayOnFailover || 100,
        maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
        lazyConnect: true,
      });
    }

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.redis.on('connect', () => {
      console.log('⚡ Redis connection established');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      console.log('✅ Redis is ready to accept commands');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', (ms) => {
      console.log(`🔄 Redis reconnecting in ${ms}ms`);
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.redis.connect();
      console.log('✅ Cache service connected to Redis');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      console.log('✅ Cache service disconnected from Redis');
    } catch (error) {
      console.error('❌ Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  // Basic get/set operations
  public async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ Redis not connected, skipping cache get');
        return null;
      }

      const value = await this.redis.get(this.getKey(key));
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ Redis not connected, skipping cache set');
        return false;
      }

      const serialized = JSON.stringify(value);
      const fullKey = this.getKey(key);

      if (ttlSeconds) {
        await this.redis.setex(fullKey, ttlSeconds, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }

      return true;
    } catch (error) {
      console.error('❌ Cache set error:', error);
      return false;
    }
  }

  public async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ Redis not connected, skipping cache delete');
        return false;
      }

      const result = await this.redis.del(this.getKey(key));
      return result > 0;
    } catch (error) {
      console.error('❌ Cache delete error:', error);
      return false;
    }
  }

  // Advanced operations
  public async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const result = await this.redis.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      console.error('❌ Cache exists error:', error);
      return false;
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const result = await this.redis.expire(this.getKey(key), seconds);
      return result === 1;
    } catch (error) {
      console.error('❌ Cache expire error:', error);
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) return -1;
      
      return await this.redis.ttl(this.getKey(key));
    } catch (error) {
      console.error('❌ Cache TTL error:', error);
      return -1;
    }
  }

  // Hash operations for complex objects
  public async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;
      
      const value = await this.redis.hget(this.getKey(key), field);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('❌ Cache hget error:', error);
      return null;
    }
  }

  public async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const serialized = JSON.stringify(value);
      await this.redis.hset(this.getKey(key), field, serialized);
      return true;
    } catch (error) {
      console.error('❌ Cache hset error:', error);
      return false;
    }
  }

  public async hgetall<T = Record<string, any>>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;
      
      const hash = await this.redis.hgetall(this.getKey(key));
      if (!hash || Object.keys(hash).length === 0) return null;

      const result: any = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value; // Keep as string if not valid JSON
        }
      }

      return result as T;
    } catch (error) {
      console.error('❌ Cache hgetall error:', error);
      return null;
    }
  }

  // List operations
  public async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      
      const serialized = values.map(v => JSON.stringify(v));
      return await this.redis.lpush(this.getKey(key), ...serialized);
    } catch (error) {
      console.error('❌ Cache lpush error:', error);
      return 0;
    }
  }

  public async rpush(key: string, ...values: any[]): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      
      const serialized = values.map(v => JSON.stringify(v));
      return await this.redis.rpush(this.getKey(key), ...serialized);
    } catch (error) {
      console.error('❌ Cache rpush error:', error);
      return 0;
    }
  }

  public async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    try {
      if (!this.isConnected) return [];
      
      const values = await this.redis.lrange(this.getKey(key), start, stop);
      return values.map(v => {
        try {
          return JSON.parse(v) as T;
        } catch {
          return v as T;
        }
      });
    } catch (error) {
      console.error('❌ Cache lrange error:', error);
      return [];
    }
  }

  // Cache with automatic serialization/deserialization
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        console.log(`📦 Cache hit: ${key}`);
        return cached;
      }

      // If not in cache, generate the value
      console.log(`⚡ Cache miss: ${key}, generating value`);
      const value = await factory();
      
      // Store in cache
      await this.set(key, value, ttlSeconds);
      
      return value;
    } catch (error) {
      console.error('❌ Cache getOrSet error:', error);
      
      // Try to generate value directly if cache fails
      try {
        return await factory();
      } catch (factoryError) {
        console.error('❌ Factory function error:', factoryError);
        return null;
      }
    }
  }

  // Bulk operations
  public async mget<T = any>(...keys: string[]): Promise<(T | null)[]> {
    try {
      if (!this.isConnected) return keys.map(() => null);
      
      const fullKeys = keys.map(k => this.getKey(k));
      const values = await this.redis.mget(...fullKeys);
      
      return values.map(v => {
        if (!v) return null;
        try {
          return JSON.parse(v) as T;
        } catch {
          return v as T;
        }
      });
    } catch (error) {
      console.error('❌ Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  public async mset(pairs: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of Object.entries(pairs)) {
        const fullKey = this.getKey(key);
        const serialized = JSON.stringify(value);
        
        if (ttlSeconds) {
          pipeline.setex(fullKey, ttlSeconds, serialized);
        } else {
          pipeline.set(fullKey, serialized);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('❌ Cache mset error:', error);
      return false;
    }
  }

  // Pattern-based operations
  public async deleteByPattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      
      const keys = await this.redis.keys(this.getKey(pattern));
      if (keys.length === 0) return 0;
      
      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      console.error('❌ Cache deleteByPattern error:', error);
      return 0;
    }
  }

  // Health check
  public async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected' };
      }

      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      return { status: 'healthy', latency };
    } catch (error) {
      console.error('❌ Cache health check error:', error);
      return { status: 'unhealthy' };
    }
  }

  // Get connection status
  public getConnectionStatus(): {
    connected: boolean;
    status: string;
  } {
    return {
      connected: this.isConnected,
      status: this.redis.status
    };
  }
}

export default CacheService;