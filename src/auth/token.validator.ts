import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';
import { extractTokenFromHeader } from './utils/token.util';

export interface TokenPayload extends JWTPayload {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  token_use: 'access' | 'id';
  client_id?: string;
  'cognito:groups'?: string[];
}

export class TokenValidator {
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private issuer: string,
    private audience: string,
    private jwksUri: string,
  ) {
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async validate(token: string): Promise<TokenPayload> {
    try {
      // Validar formato básico
      if (!token || typeof token !== 'string') {
        throw new Error('Token must be a non-empty string');
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Extraer token del header (validación)
      const extraction = extractTokenFromHeader(`Bearer ${token}`);
      if (!extraction.success) {
        throw new Error(extraction.error);
      }

      // Verificar firma
      await this.verifySignature(token);

      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      const tokenPayload = payload as unknown as TokenPayload;

      // Validar token_use
      if (tokenPayload.token_use !== 'access') {
        throw new Error('Invalid token type');
      }

      // Validar issuer explícitamente
      if (tokenPayload.iss !== this.issuer) {
        throw new Error('Invalid issuer');
      }

      // Validar audience o client_id
      const validAudience = tokenPayload.aud === this.audience || 
                            tokenPayload.client_id === this.audience;
      if (!validAudience) {
        throw new Error('Invalid audience or client_id');
      }

      // Validar expiración con clock skew
      this.validateExpiration(tokenPayload);

      return tokenPayload;
    } catch (error: any) {
      // Manejar errores específicos
      if (error.message.includes('JWKS')) {
        throw new Error('JWKS fetch failed');
      }
      if (error.message.includes('expired')) {
        throw new Error('Token expired');
      }
      throw new Error('Token validation failed');
    }
  }

  private async verifySignature(token: string): Promise<void> {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf-8'));

    if (!header.kid) {
      throw new Error('Missing kid in token header');
    }

    // La firma se verifica automáticamente con jwtVerify
    // Este método es para validación explícita
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