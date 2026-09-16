import { createRemoteJWKSet } from 'jose';

export class JwksProvider {
  private jwks: ReturnType<typeof createRemoteJWKSet>;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: number = 3600000; // 1 hora

  constructor(private jwksUri: string) {
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async getJwks(): Promise<any> {
    const cached = this.cache.get('jwks');
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    const response = await fetch(this.jwksUri);
    const jwks = await response.json();

    this.cache.set('jwks', {
      data: jwks,
      expiry: Date.now() + this.cacheExpiry,
    });

    return jwks;
  }

  async getPublicKey(kid: string): Promise<any> {
    const jwks = await this.getJwks();
    const key = jwks.keys.find((k: any) => k.kid === kid);
    
    if (!key) {
      throw new Error('Public key not found for kid');
    }

    return key;
  }

  clearCache(): void {
    this.cache.clear();
  }
}