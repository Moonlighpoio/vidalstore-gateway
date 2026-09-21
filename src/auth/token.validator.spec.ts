import { TokenValidator } from './token.validator';
import * as jose from 'jose';

// Mock de jose
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
}));

describe('TokenValidator', () => {
  let validator: TokenValidator;
  const mockIssuer = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXX';
  const mockAudience = 'test-client-id';
  const mockJwksUri = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXX/.well-known/jwks.json';

  beforeEach(() => {
    validator = new TokenValidator(mockIssuer, mockAudience, mockJwksUri);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a valid token', async () => {
    const mockPayload = {
      sub: 'user-123',
      iss: mockIssuer,
      aud: mockAudience,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      token_use: 'access',
      client_id: mockAudience,
    };

    (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

    const result = await validator.validate('valid.token.here');

    expect(result.sub).toBe('user-123');
    expect(result.iss).toBe(mockIssuer);
    expect(result.token_use).toBe('access');
  });

  it('should reject token issued for another App Client', async () => {
    const mockPayload = {
      sub: 'user-123',
      iss: mockIssuer,
      aud: 'other-client-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      token_use: 'access',
      client_id: 'other-client-id',
    };

    (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

    await expect(validator.validate('token.here')).rejects.toThrow(
      'Token validation failed',
    );
  });

  it('should reject token with invalid issuer', async () => {
    const mockPayload = {
      sub: 'user-123',
      iss: 'https://wrong-issuer.com',
      aud: mockAudience,
      exp: Math.floor(Date.now() / 1000) + 3600,
      token_use: 'access',
    };

    (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

    await expect(validator.validate('token.here')).rejects.toThrow('Token validation failed');
  });

  it('should reject token with wrong token_use', async () => {
    const mockPayload = {
      sub: 'user-123',
      iss: mockIssuer,
      aud: mockAudience,
      exp: Math.floor(Date.now() / 1000) + 3600,
      token_use: 'id', // Wrong type
    };

    (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

    await expect(validator.validate('token.here')).rejects.toThrow('Token validation failed');
  });

  it('should reject expired token', async () => {
    const mockPayload = {
      sub: 'user-123',
      iss: mockIssuer,
      aud: mockAudience,
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired
      token_use: 'access',
    };

    (jose.jwtVerify as jest.Mock).mockResolvedValue({ payload: mockPayload });

    await expect(validator.validate('token.here')).rejects.toThrow('Token validation failed');
  });
});