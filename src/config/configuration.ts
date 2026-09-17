export default () => ({
  port: Number.parseInt(process.env.PORT || '8080', 10),

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  },

  bff: {
    url: process.env.BFF_URL || 'http://localhost:8081',
  },

  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    appClientId: process.env.COGNITO_APP_CLIENT_ID,
    region: process.env.COGNITO_REGION,
    issuer: process.env.COGNITO_ISSUER,
    jwksUri: process.env.COGNITO_JWKS_URI,
  },
});