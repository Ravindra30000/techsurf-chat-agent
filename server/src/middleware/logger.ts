import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip: string;
  tenantId?: string;
  userId?: string;
  error?: string;
  metadata?: any;
}

class Logger {
  private logDir: string;
  private logLevel: string;

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFile(type: string): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  public log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const logLine = JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString()
    }) + '\n';

    const logFile = this.getLogFile(entry.level);
    try {
      fs.appendFileSync(logFile, logLine);
      if (process.env.NODE_ENV === 'development') {
        const colorMap: Record<string, string> = {
          info: '\x1b[32m',
          warn: '\x1b[33m',
          error: '\x1b[31m',
          debug: '\x1b[36m'
        };
        const reset = '\x1b[0m';
        const color = colorMap[entry.level] || '';
        console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.method} ${entry.url} - ${entry.responseTime || 0}ms`);
        if (entry.error) {
          console.error(`${color}Error:${reset} ${entry.error}`);
        }
      }
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }
}

const loggerInstance = new Logger();

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    const responseTime = Date.now() - startTime;
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent') || '',
      ip,
      tenantId,
      userId,
      metadata: {
        query: Object.keys(req.query).length ? req.query : undefined,
        body: req.body && Object.keys(req.body).length ? req.body : undefined
      }
    };

    loggerInstance.log(entry);
    originalEnd.apply(res, args);
  };

  next();
};

export default logger;
