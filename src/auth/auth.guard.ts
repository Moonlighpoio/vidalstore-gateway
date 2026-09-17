import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenValidator } from './token.validator';
import { extractBearerToken } from './token-extractor';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly tokenValidator: TokenValidator;

  constructor(private readonly configService: ConfigService) {
    const issuer =
      this.configService.get<string>('COGNITO_ISSUER');
    const audience =
      this.configService.get<string>('COGNITO_AUDIENCE');
    const jwksUri =
      this.configService.get<string>('COGNITO_JWKS_URI');

    if (!issuer || !audience || !jwksUri) {
      throw new Error('Missing Cognito configuration');
    }

    this.tokenValidator = new TokenValidator(
      issuer,
      audience,
      jwksUri,
    );
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const token = extractBearerToken(
        request.headers.authorization,
      );

      request.user = await this.tokenValidator.validate(token);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid token');
    }
  }
}