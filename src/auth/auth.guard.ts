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

    console.log('🛡️ [AuthGuard] Iniciando validación...');
    console.log('🛡️ [AuthGuard] Authorization header:', request.headers.authorization ? 'Presente' : 'Ausente');

    try {
      const token = extractBearerToken(
        request.headers.authorization,
      );

      console.log('🛡️ [AuthGuard] Token extraído, validando...');

      request.user = await this.tokenValidator.validate(token);
      
      console.log('✅ [AuthGuard] Token válido, usuario:', request.user.sub);
      console.log('✅ [AuthGuard] Permitiendo acceso...');
      
      return true;
    } catch (error) {
      console.error('❌ [AuthGuard] Error:', error instanceof Error ? error.message : error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }


      throw new UnauthorizedException('Invalid token');
    }
  }
}