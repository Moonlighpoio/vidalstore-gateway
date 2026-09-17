import { extractTokenFromHeader, TokenExtractionResult } from './token.util';

describe('extractTokenFromHeader', () => {
  it('should extract token from valid Bearer header', () => {
    const result: TokenExtractionResult = extractTokenFromHeader('Bearer valid.token.here');
    
    expect(result.success).toBe(true);
    expect(result.token).toBe('valid.token.here');
    expect(result.error).toBeUndefined();
  });

  it('should fail when header is undefined', () => {
    const result: TokenExtractionResult = extractTokenFromHeader(undefined);
    
    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.error).toBe('Missing authorization header');
  });

  it('should fail when header does not start with Bearer', () => {
    const result: TokenExtractionResult = extractTokenFromHeader('Basic some.credentials');
    
    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.error).toBe('Invalid authorization header format');
  });

  it('should fail when token is empty', () => {
    const result: TokenExtractionResult = extractTokenFromHeader('Bearer ');
    
    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.error).toBe('Empty token');
  });

  it('should fail when token is only whitespace', () => {
    const result: TokenExtractionResult = extractTokenFromHeader('Bearer    ');
    
    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.error).toBe('Empty token');
  });
});