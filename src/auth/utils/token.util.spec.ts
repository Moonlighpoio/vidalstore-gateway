import { extractTokenFromHeader } from './token.util';

describe('extractTokenFromHeader', () => {
  it('should extract token from valid Bearer header', () => {
    const result = extractTokenFromHeader('Bearer valid.token.here');
    
    expect(result.success).toBe(true);
    expect(result.token).toBe('valid.token.here');
    expect(result.error).toBeUndefined();
  });

  it('should fail when header is undefined', () => {
    const result = extractTokenFromHeader(undefined);
    
    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.error).toBe('Missing authorization header');
  });

  it('should fail when header does not start with Bearer', () => {
    const result = extractTokenFromHeader('Basic some.credentials');
    
    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.error).toBe('Invalid authorization header format');
  });

  it('should fail when token is empty', () => {
    const result = extractTokenFromHeader('Bearer ');
    
    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.error).toBe('Empty token');
  });

  it('should fail when token is only whitespace', () => {
    const result = extractTokenFromHeader('Bearer    ');
    
    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.error).toBe('Empty token');
  });
});