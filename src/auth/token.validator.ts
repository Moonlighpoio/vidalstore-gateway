import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { extractTokenFromHeader } from './utils/token.util';

export interface TokenPayload extends JWTPayload {
  sub: string;
  iss: string;
  exp: number;
  iat: number;
  token_use: 'access' | 'id';
  client_id?: string;
  aud?: string | string[];
  'cognito:groups'?: string[];
}

export class TokenValidator {
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly issuer: string,
    private readonly audience: string,
    jwksUri: string,
  ) {
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async validate(token: string): Promise<TokenPayload> {
    console.log('🔍 Token recibido:', token.substring(0, 50) + '...');
    console.log('🔍 Issuer configurado:', this.issuer);
    console.log('🔍 Audience configurado:', this.audience);

    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Token must be a non-empty string');
      }

      const parts = token.split('.');

      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const extraction = extractTokenFromHeader(`Bearer ${token}`);

      if (!extraction.success) {
        throw new Error(extraction.error);
      }

      console.log('⏳ Verificando firma con JWKS...');

      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
      });

      console.log('✅ Firma verificada correctamente');

      const tokenPayload = payload as TokenPayload;

      console.log('🔍 token_use:', tokenPayload.token_use);
      console.log('🔍 client_id del token:', tokenPayload.client_id);
      console.log('🔍 client_id esperado:', this.audience);
      console.log('🔍 iss del token:', tokenPayload.iss);
      console.log('🔍 iss esperado:', this.issuer);

      if (tokenPayload.token_use !== 'access') {
        console.error('❌ token_use incorrecto');
        throw new Error('Invalid token type: access token required');
      }

      if (tokenPayload.client_id !== this.audience) {
        console.error('❌ client_id incorrecto');
        throw new Error('Invalid client_id');
      }

      if (tokenPayload.iss !== this.issuer) {
        console.error('❌ iss incorrecto');
        throw new Error('Invalid issuer');
      }

      console.log('✅ Validación de claims completada');

      this.validateExpiration(tokenPayload);

      console.log('✅ Token válido, retornando payload');

      return tokenPayload;
    } catch (error: unknown) {
      console.error('❌ Error en validación:', error instanceof Error ? error.message : error);

      if (error instanceof Error) {
        if (error.message.includes('JWKS')) {
          throw new Error('JWKS fetch failed');
        }

        if (
          error.message.includes('expired') ||
          error.message.includes('ERR_JWT_EXPIRED')
        ) {
          throw new Error('Token expired');
        }

        if (error.message.includes('Invalid client_id')) {
          throw new Error('Token issued for another App Client');
        }

        if (error.message.includes('Invalid token type')) {
          throw new Error('Access token required');
        }
      }

      throw new Error('Token validation failed');
    }
  }

  private validateExpiration(payload: TokenPayload): void {
    const now = Math.floor(Date.now() / 1000);
    const clockSkew = 60;

    if (payload.exp && now > payload.exp + clockSkew) {
      throw new Error('Token expired');
    }

    if (payload.iat && now < payload.iat - clockSkew) {
      throw new Error('Token not yet valid');
    }
  }
}