import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';

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

      // Validar audience explícitamente
      if (tokenPayload.aud !== this.audience) {
        throw new Error('Invalid audience');
      }

      // Validar expiración con clock skew
      this.validateExpiration(tokenPayload);

      return tokenPayload;
    } catch (error) {
      throw new Error('Token validation failed');
    }
  }

  private validateExpiration(payload: TokenPayload): void {
    const now = Math.floor(Date.now() / 1000);
    const clockSkew = 60; // 60 segundos de tolerancia

    // Validar expiración
    if (payload.exp && now > payload.exp + clockSkew) {
      throw new Error('Token expired');
    }

    // Validar que no sea futuro (iat)
    if (payload.iat && now < payload.iat - clockSkew) {
      throw new Error('Token not yet valid');
    }
  }
}