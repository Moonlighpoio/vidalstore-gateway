import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(UnauthorizedException)
export class AuthExceptionFilter
  implements ExceptionFilter
{
  catch(
    exception: UnauthorizedException,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.UNAUTHORIZED).json({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message: 'Authentication failed',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}