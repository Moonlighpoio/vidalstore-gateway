export const cognitoConfig = {
  issuer: process.env.COGNITO_ISSUER,
  audience: process.env.COGNITO_AUDIENCE,
  jwksUri: process.env.COGNITO_JWKS_URI,
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  region: process.env.COGNITO_REGION,
};