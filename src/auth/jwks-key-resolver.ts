import {
  createRemoteJWKSet,
  jwtVerify,
  JWTVerifyResult,
} from 'jose';

export class JwksKeyResolver {
  private remoteJwks: ReturnType<
    typeof createRemoteJWKSet
  >;

  constructor(private readonly jwksUri: string) {
    this.remoteJwks = this.createResolver();
  }

  async verify(
    token: string,
    options: Parameters<typeof jwtVerify>[2],
  ): Promise<JWTVerifyResult> {
    try {
      return await jwtVerify(token, this.remoteJwks, options);
    } catch (error) {
      if (!this.isKeyResolutionError(error)) {
        throw error;
      }

      this.invalidate();

      return jwtVerify(token, this.remoteJwks, options);
    }
  }

  private createResolver(): ReturnType<
    typeof createRemoteJWKSet
  > {
    return createRemoteJWKSet(new URL(this.jwksUri));
  }

  private invalidate(): void {
    this.remoteJwks = this.createResolver();
  }

  private isKeyResolutionError(error: unknown): boolean {
    const message =
      error instanceof Error ? error.message : '';

    return (
      message.includes('no applicable key found') ||
      message.includes('JWKS') ||
      message.includes('kid')
    );
  }
}