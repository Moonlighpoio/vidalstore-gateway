import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
} from 'jose';

export interface TokenPayload extends JWTPayload {
  sub: string;
  iss: string;
  aud?: string | string[];
  exp: number;
  iat: number;
  token_use: 'access' | 'id';
  client_id?: string;
  scope?: string;
  'cognito:groups'?: string[];
}

export class TokenValidator {
  private readonly jwks: ReturnType<
    typeof createRemoteJWKSet
  >;

  constructor(
    private readonly issuer: string,
    private readonly audience: string,
    jwksUri: string,
  ) {
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async validate(token: string): Promise<TokenPayload> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: ['RS256'],
    });

    const tokenPayload = payload as TokenPayload;

    if (tokenPayload.token_use !== 'access') {
      throw new Error('Invalid token type');
    }

    return tokenPayload;
  }
}