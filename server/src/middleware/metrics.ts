import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface MetricData {
  method: string;
  route: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  tenantId?: string;
  userId?: string;
  memoryUsage: NodeJS.MemoryUsage;
}

class MetricsCollector {
  private metrics: MetricData[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics in memory
  private readonly CLEANUP_THRESHOLD = 12000;

  public addMetric(metric: MetricData): void {
    this.metrics.push(metric);
    
    // Cleanup old metrics to prevent memory leaks
    if (this.metrics.length > this.CLEANUP_THRESHOLD) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  public getMetrics(hours: number = 1): MetricData[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  public getStats(hours: number = 1): any {
    const metrics = this.getMetrics(hours);
    
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        requestsByMethod: {},
        requestsByStatus: {},
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      };
    }

    // Calculate response time percentiles
    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    // Group by method
    const methodCounts = metrics.reduce((acc, m) => {
      acc[m.method] = (acc[m.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status code
    const statusCounts = metrics.reduce((acc, m) => {
      const statusClass = `${Math.floor(m.statusCode / 100)}xx`;
      acc[statusClass] = (acc[statusClass] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate error rate (4xx and 5xx)
    const errorRequests = metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorRequests / metrics.length) * 100;

    return {
      totalRequests: metrics.length,
      averageResponseTime: Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length),
      requestsByMethod: methodCounts,
      requestsByStatus: statusCounts,
      errorRate: Math.round(errorRate * 100) / 100,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      timeRange: `${hours}h`,
      memoryUsage: process.memoryUsage()
    };
  }

  public getHealthMetrics(): any {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const recentMetrics = this.getMetrics(0.25); // Last 15 minutes

    return {
      uptime: Math.floor(uptime),
      uptimeFormatted: this.formatUptime(uptime),
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
      },
      cpuUsage: process.cpuUsage(),
      recentActivity: {
        requestsLast15min: recentMetrics.length,
        averageResponseTime: recentMetrics.length > 0 
          ? Math.round(recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length)
          : 0
      }
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  public getTenantStats(tenantId: string, hours: number = 24): any {
    const metrics = this.getMetrics(hours).filter(m => m.tenantId === tenantId);
    return this.calculateStatsForMetrics(metrics);
  }

  private calculateStatsForMetrics(metrics: MetricData[]): any {
    if (metrics.length === 0) return null;

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const errorRequests = metrics.filter(m => m.statusCode >= 400).length;

    return {
      totalRequests: metrics.length,
      averageResponseTime: Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length),
      errorRate: Math.round((errorRequests / metrics.length) * 10000) / 100, // 2 decimal places
      fastestResponse: responseTimes,
      slowestResponse: responseTimes[responseTimes.length - 1],
      requestsPerHour: Math.round(metrics.length / (metrics.length > 0 ? 
        (Math.max(...metrics.map(m => m.timestamp)) - Math.min(...metrics.map(m => m.timestamp))) / (1000 * 60 * 60) 
        : 1))
    };
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public exportMetrics(): MetricData[] {
    return [...this.metrics];
  }
}

const metricsCollector = new MetricsCollector();

export const metrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    // Extract route pattern for better grouping
    const route = req.route ? req.route.path : req.path;
    const tenantId = req.headers['x-tenant-id'] as string || (req as any).tenant?.id;
    const userId = req.headers['x-user-id'] as string || (req as any).user?.id;

    const metric: MetricData = {
      method: req.method,
      route,
      statusCode: res.statusCode,
      responseTime,
      timestamp: Date.now(),
      tenantId,
      userId,
      memoryUsage: process.memoryUsage()
    };

    metricsCollector.addMetric(metric);

    // Add performance headers
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.setHeader('X-Process-Memory', `${Math.round(metric.memoryUsage.heapUsed / 1024 / 1024)}MB`);

    originalEnd.apply(res, args);
  };

  next();
};

// Middleware to expose metrics endpoint
export const metricsEndpoint = (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 1;
  const format = req.query.format as string || 'json';
  
  if (req.path.includes('/health')) {
    return res.json(metricsCollector.getHealthMetrics());
  }
  
  if (req.path.includes('/export')) {
    const allMetrics = metricsCollector.exportMetrics();
    
    if (format === 'csv') {
      const csvHeader = 'timestamp,method,route,statusCode,responseTime,tenantId,userId\n';
      const csvData = allMetrics.map(m => 
        `${new Date(m.timestamp).toISOString()},${m.method},${m.route},${m.statusCode},${m.responseTime},${m.tenantId || ''},${m.userId || ''}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="metrics.csv"');
      return res.send(csvHeader + csvData);
    }
    
    return res.json(allMetrics);
  }

  const stats = metricsCollector.getStats(hours);
  res.json({
    ...stats,
    collectionInfo: {
      totalMetricsStored: metricsCollector.exportMetrics().length,
      oldestMetric: metricsCollector.exportMetrics().length > 0 
        ? new Date(Math.min(...metricsCollector.exportMetrics().map(m => m.timestamp))).toISOString()
        : null,
      newestMetric: metricsCollector.exportMetrics().length > 0
        ? new Date(Math.max(...metricsCollector.exportMetrics().map(m => m.timestamp))).toISOString()
        : null
    }
  });
};

export { metricsCollector };
export default metrics;
