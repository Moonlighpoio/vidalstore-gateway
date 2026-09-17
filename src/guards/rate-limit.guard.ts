import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requestCounts: Map<string, RateLimitInfo> = new Map();
  private readonly limit = 10; // 10 intentos
  private readonly windowMs = 60000; // 1 minuto

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';

    const now = Date.now();
    const info = this.requestCounts.get(ip);

    if (!info || now > info.resetTime) {
      // Nueva ventana
      this.requestCounts.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (info.count >= this.limit) {
      throw new HttpException(
        'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Incrementar contador
    info.count++;
    this.requestCounts.set(ip, info);

    return true;
  }
}