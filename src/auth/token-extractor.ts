import { UnauthorizedException } from '@nestjs/common';

export function extractBearerToken(
  authorizationHeader?: string,
): string {
  if (!authorizationHeader) {
    throw new UnauthorizedException(
      'Missing authorization header',
    );
  }

  const [scheme, token, ...extraParts] =
    authorizationHeader.trim().split(/\s+/);

  if (
    scheme?.toLowerCase() !== 'bearer' ||
    !token ||
    extraParts.length > 0
  ) {
    throw new UnauthorizedException(
      'Invalid authorization header',
    );
  }

  return token;
}