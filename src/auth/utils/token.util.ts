export interface TokenExtractionResult {
  success: boolean;
  token?: string;
  error?: string;
}

export function extractTokenFromHeader(authHeader: string | undefined): TokenExtractionResult {
  if (!authHeader) {
    return {
      success: false,
      error: 'Missing authorization header',
    };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Invalid authorization header format',
    };
  }

  const token = authHeader.substring(7);

  if (!token || token.trim().length === 0) {
    return {
      success: false,
      error: 'Empty token',
    };
  }

  return {
    success: true,
    token,
  };
}