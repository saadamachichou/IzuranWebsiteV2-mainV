import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  timestamp: Date;
  statusCode: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private slowThreshold = 200; // 200ms threshold for slow requests

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const originalSend = res.send;
      const originalJson = res.json;

      // Override res.send to capture response time
      res.send = function(body: any) {
        const responseTime = Date.now() - start;
        this.captureMetrics(req, res, responseTime);
        return originalSend.call(this, body);
      }.bind(this);

      // Override res.json to capture response time
      res.json = function(body: any) {
        const responseTime = Date.now() - start;
        this.captureMetrics(req, res, responseTime);
        return originalJson.call(this, body);
      }.bind(this);

      next();
    };
  }

  private captureMetrics(req: Request, res: Response, responseTime: number) {
    const metric: PerformanceMetrics = {
      endpoint: req.path,
      method: req.method,
      responseTime,
      timestamp: new Date(),
      statusCode: res.statusCode
    };

    this.metrics.push(metric);

    // Log slow requests
    if (responseTime > this.slowThreshold) {
      console.warn(`🐌 Slow request detected: ${req.method} ${req.path} took ${responseTime}ms`);
    }

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getSlowRequests(threshold: number = this.slowThreshold) {
    return this.metrics.filter(m => m.responseTime > threshold);
  }

  getAverageResponseTime(endpoint?: string) {
    const filtered = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.responseTime, 0);
    return Math.round(total / filtered.length);
  }

  getEndpointStats() {
    const stats = new Map<string, { count: number; avgTime: number; slowCount: number }>();
    
    this.metrics.forEach(metric => {
      const existing = stats.get(metric.endpoint) || { count: 0, avgTime: 0, slowCount: 0 };
      existing.count++;
      existing.avgTime = (existing.avgTime * (existing.count - 1) + metric.responseTime) / existing.count;
      if (metric.responseTime > this.slowThreshold) existing.slowCount++;
      stats.set(metric.endpoint, existing);
    });

    return Object.fromEntries(stats);
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
