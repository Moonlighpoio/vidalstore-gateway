import { Injectable, LoggerService } from '@nestjs/common';

export interface AuthLogEvent {
  timestamp: string;
  event: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'TOKEN_INVALID' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED_ACCESS';
  ip: string;
  userAgent: string;
  userId?: string;
  reason?: string;
}

@Injectable()
export class AuthLoggerService implements LoggerService {
  private readonly serviceName = 'AuthLogger';

  log(event: AuthLogEvent): void {
    // NO loggear tokens completos por seguridad
    const logEntry = {
      timestamp: event.timestamp,
      service: this.serviceName,
      event: event.event,
      ip: event.ip,
      userAgent: event.userAgent,
      userId: event.userId || 'anonymous',
      reason: event.reason,
    };

    console.log(JSON.stringify(logEntry));
  }

  error(message: string, trace?: string): void {
    console.error(`[${this.serviceName}] ${message}`, trace);
  }

  warn(message: string): void {
    console.warn(`[${this.serviceName}] ${message}`);
  }

  info(message: string): void {
    console.info(`[${this.serviceName}] ${message}`);
  }

  debug(message: string): void {
    console.debug(`[${this.serviceName}] ${message}`);
  }
}