import { AuthGuard } from './auth.guard';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockConfigService: Partial<ConfigService>;
  let mockExecutionContext: Partial<ExecutionContext>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          'COGNITO_ISSUER': 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXX',
          'COGNITO_AUDIENCE': 'test-client-id',
          'COGNITO_JWKS_URI': 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXX/.well-known/jwks.json',
        };
        return config[key];
      }),
    };

    guard = new AuthGuard(mockConfigService as ConfigService);
  });

  it('should throw UnauthorizedException when authorization header is missing', async () => {
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {},
        }),
      }),
    };

    await expect(guard.canActivate(mockExecutionContext as ExecutionContext))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when header does not start with Bearer', async () => {
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {
            authorization: 'Basic credentials',
          },
        }),
      }),
    };

    await expect(guard.canActivate(mockExecutionContext as ExecutionContext))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should return true when token is valid', async () => {
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {
            authorization: 'Bearer valid.token.here',
          },
        }),
      }),
    };

    // Mock del TokenValidator
    const validateSpy = jest
      .spyOn((guard as any).tokenValidator, 'validate')
      .mockResolvedValue({
        sub: 'user-123',
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXX',
        aud: 'test-client-id',
        token_use: 'access',
      });

    const result = await guard.canActivate(mockExecutionContext as ExecutionContext);

    expect(result).toBe(true);
    validateSpy.mockRestore();
  });
});