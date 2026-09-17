import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenValidator } from './token.validator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.tokenValidator.validate(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}