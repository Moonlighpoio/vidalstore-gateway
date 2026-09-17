import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenValidator } from './token.validator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private tokenValidator: TokenValidator;

  constructor(private configService: ConfigService) {
    const issuer = this.configService.get<string>('COGNITO_ISSUER');
    const audience = this.configService.get<string>('COGNITO_AUDIENCE');
    const jwksUri = this.configService.get<string>('COGNITO_JWKS_URI');

    if (!issuer || !audience || !jwksUri) {
      throw new Error('Missing Cognito configuration');
    }

    this.tokenValidator = new TokenValidator(issuer, audience, jwksUri);
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.tokenValidator.validate(token);
      (req as any).user = payload;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}