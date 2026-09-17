# VidalStore Gateway

API Gateway for VidalStore platform. Validates JWT tokens from AWS Cognito and proxies requests to BFF.

## Architecture
┌─────────────────┐ ┌──────────────────┐ ┌─────────┐
│ Angular │ ──> │ API Gateway │ ──> │ BFF │
│ (frontend) │ │ (NestJS:8080) │ │(:8081) │
└─────────────────┘ └──────────────────┘ └─────────┘
│
▼
┌──────────────┐
│ AWS Cognito │
│ (JWKS) │
└──────────────┘

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS Cognito User Pool

### Installation

```bash
# Install dependencies
npm install

# Copy environment example
cp .env.example .env

# Edit .env with your Cognito credentials
nano .env
```

### Environment Variables

Required variables in `.env`:

```bash
# Server
PORT=8080
NODE_ENV=development

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
COGNITO_REGION=us-east-1
COGNITO_ISSUER=[https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX](https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX)
COGNITO_AUDIENCE=XXXXXXXXXXXXXXXXXXXXXXXXXX
COGNITO_JWKS_URI=[https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json](https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json)

# CORS
CORS_ORIGIN=http://localhost:4200

# BFF
BFF_URL=http://localhost:8081
```

### Run

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The gateway will be available at `http://localhost:8080`

## API Endpoints

All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header.

### Catalogo

- `GET /v1/catalogo` - List all games
- `POST /v1/catalogo` - Create a new game (editors/admins)
- `PUT /v1/catalogo/:juegoId` - Update a game (editors/admins)

### Biblioteca

- `GET /v1/biblioteca` - Get user's library
- `POST /v1/compras` - Create a new purchase

### Licencias (Admin only)

- `GET /v1/licencias` - List all licenses
- `DELETE /v1/licencias/:id` - Revoke a license

## Security Tests

### Test 1: Request without token

```bash
curl -i http://localhost:8080/v1/catalogo
# Expected: 401 Unauthorized
```

### Test 2: Request with invalid token

```bash
curl -i \
  -H "Authorization: Bearer invalid.token.here" \
  http://localhost:8080/v1/catalogo
# Expected: 401 Unauthorized
```

### Test 3: Request with token from different app client

```bash
curl -i \
  -H "Authorization: Bearer <token-from-other-app>" \
  http://localhost:8080/v1/catalogo
# Expected: 401 Unauthorized
```

### Test 4: Request with valid token but insufficient permissions

```bash
curl -i \
  -H "Authorization: Bearer <player-token>" \
  -X DELETE \
  http://localhost:8080/v1/licencias/some-id
# Expected: 403 Forbidden (handled by BFF)
```

## Tech Stack

- NestJS
- TypeScript
- jose (JWT validation)
- axios (HTTP client)

## License

Private - VidalStore EP1