# VidalStore Gateway

API Gateway for the VidalStore platform. It validates JWT access tokens issued by AWS Cognito and proxies requests to the BFF.

## Architecture

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────┐
│     Angular     │ ──> │   API Gateway    │ ──> │   BFF   │
│   (frontend)    │     │   (NestJS:8080)  │     │ (:8081) │
└─────────────────┘     └──────────────────┘     └─────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ AWS Cognito  │
                        │    (JWKS)    │
                        └──────────────┘
```

## Features

- JWT access-token validation with AWS Cognito.
- Signature verification using Cognito JWKS.
- Issuer, audience, client ID, token type and expiration validation.
- Configurable clock-skew tolerance.
- Protected routes using a NestJS authentication guard.
- CORS configuration for the frontend.
- Proxy communication between the frontend and the BFF.
- Structured authentication logging.
- Health-check endpoint.
- Security test examples with `curl`.

## Prerequisites

- Node.js 18 or later.
- npm or yarn.
- An AWS Cognito user pool.
- A configured Cognito app client.
- A running VidalStore BFF service.

## Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd vidalstore-gateway
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Then update `.env` with your actual Cognito and BFF configuration.

## Environment Variables

Example `.env` configuration:

```env
# Server
PORT=8080
NODE_ENV=development

# AWS Cognito
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

### Variable Description

| Variable | Description |
|---|---|
| `PORT` | Port used by the gateway. |
| `NODE_ENV` | Application environment. |
| `COGNITO_USER_POOL_ID` | AWS Cognito user pool identifier. |
| `COGNITO_APP_CLIENT_ID` | Cognito app client identifier. |
| `COGNITO_REGION` | AWS region where Cognito is deployed. |
| `COGNITO_ISSUER` | Cognito issuer URL. |
| `COGNITO_AUDIENCE` | Expected token audience when applicable. |
| `COGNITO_JWKS_URI` | URL used to retrieve Cognito public signing keys. |
| `CORS_ORIGIN` | Allowed frontend origin. |
| `BFF_URL` | Base URL of the VidalStore BFF. |

Do not commit the real `.env` file or any secret credentials to the repository.

## Running the Application

### Development

```bash
npm run start:dev
```

### Standard start

```bash
npm run start
```

### Production build

```bash
npm run build
npm run start:prod
```

The gateway will be available at:

```text
http://localhost:8080
```

## API Endpoints

Protected endpoints require a valid access token in the following header:

```http
Authorization: Bearer <access-token>
```

### Health

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| `GET` | `/health` | Returns gateway health information. | Not required |

Example:

```bash
curl -i http://localhost:8080/health
```

### Catalog

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/catalogo` | Returns the catalog of games. |
| `POST` | `/v1/catalogo` | Creates a new game. |
| `PUT` | `/v1/catalogo/:juegoId` | Updates an existing game. |

Example:

```bash
curl -i \
  -H "Authorization: Bearer <access-token>" \
  http://localhost:8080/v1/catalogo
```

### Library and Purchases

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/biblioteca` | Returns the authenticated user's library. |
| `POST` | `/v1/compras` | Creates a purchase. |

Example:

```bash
curl -i \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"juegoId":"game-id"}' \
  http://localhost:8080/v1/compras
```

### Licenses

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/licencias` | Returns licenses. |
| `DELETE` | `/v1/licencias/:licenciaId` | Revokes a license. |

Example:

```bash
curl -i \
  -H "Authorization: Bearer <admin-access-token>" \
  -X DELETE \
  http://localhost:8080/v1/licencias/license-id
```

### Auditoría

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/auditoria` | Returns the revocations audit log (admin only). |

Example:

```bash
curl -i \
  -H "Authorization: Bearer <admin-access-token>" \
  http://localhost:8080/v1/auditoria
```

## Recreación del user pool con AWS CLI

Para clonar el proyecto desde cero, `scripts/setup-cognito.sh` recrea con la AWS CLI
todo el user pool de Cognito: user pool, dominio, resource server con los scopes
`catalogo.leer`, `catalogo.escribir` y `biblioteca.leer`, el app client principal
(Authorization Code + PKCE), el segundo app client de prueba ("otra aplicación"),
los grupos `jugadores`, `editores` y `administradores`, los usuarios de prueba en
sus grupos, y la configuración del trigger PostConfirmation.

```bash
cd scripts
REGION=us-east-1 ./setup-cognito.sh
```

El trigger PostConfirmation (`scripts/post-confirmation`) agrega automáticamente a
cada usuario recién registrado al grupo `jugadores`, sin intervención manual.

## Authentication

The gateway expects JWT access tokens issued by the configured Cognito user pool.

The token validation process includes:

- Authorization header validation.
- Bearer token extraction.
- JWT structure validation.
- JWT signature verification using Cognito JWKS.
- Issuer validation.
- Audience or client ID validation.
- `token_use` validation.
- Expiration validation.
- Issued-at validation with clock-skew tolerance.

For Cognito access tokens, the `client_id` claim should match the configured app client. ID tokens generally use the `aud` claim for the app client identifier.

## Security Tests

### Test 1: Request without a token

```bash
curl -i http://localhost:8080/v1/catalogo
```

Expected response:

```text
401 Unauthorized
```

### Test 2: Request with an invalid token

```bash
curl -i \
  -H "Authorization: Bearer invalid.token.here" \
  http://localhost:8080/v1/catalogo
```

Expected response:

```text
401 Unauthorized
```

### Test 3: Request with an invalid authorization scheme

```bash
curl -i \
  -H "Authorization: Basic invalid.credentials" \
  http://localhost:8080/v1/catalogo
```

Expected response:

```text
401 Unauthorized
```

### Test 4: Request with a token from another app client

```bash
curl -i \
  -H "Authorization: Bearer <token-from-another-app-client>" \
  http://localhost:8080/v1/catalogo
```

Expected response:

```text
401 Unauthorized
```

The token must belong to the configured Cognito app client.

### Test 5: Request with a valid token but insufficient permissions

```bash
curl -i \
  -H "Authorization: Bearer <player-access-token>" \
  -X DELETE \
  http://localhost:8080/v1/licencias/some-license-id
```

Expected response:

```text
403 Forbidden
```

The gateway validates the token. Role- or permission-based authorization must be enforced by the BFF or by a dedicated authorization guard.

### Test 6: Health endpoint without authentication

```bash
curl -i http://localhost:8080/health
```

Expected response:

```text
200 OK
```

## Error Responses

Authentication errors use the following general structure:

```json
{
  "statusCode": 401,
  "timestamp": "2026-09-17T18:00:00.000Z",
  "path": "/v1/catalogo",
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

The exact error message may vary depending on the failure type.

## Project Structure

```text
src/
├── auth/
│   ├── auth.guard.ts
│   ├── jwks.provider.ts
│   ├── token.validator.ts
│   └── utils/
│       └── token.util.ts
├── config/
│   ├── config.validation.ts
│   └── cors.config.ts
├── filters/
│   └── auth-exception.filter.ts
├── guards/
│   └── rate-limit.guard.ts
├── logger/
│   └── auth-logger.service.ts
├── routes/
│   ├── biblioteca/
│   │   └── biblioteca.routes.ts
│   ├── catalogo/
│   │   └── catalogo.routes.ts
│   ├── health/
│   │   └── health.routes.ts
│   ├── licencias/
│   │   └── licencias.routes.ts
│   ├── auditoria/
│   │   └── auditoria.routes.ts
│   └── routes.module.ts
├── app.module.ts
└── main.ts
```

## Testing

Run the unit and integration tests with:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:cov
```

Run the production build:

```bash
npm run build
```

## GitFlow

The project follows a GitFlow-based workflow.

Create a feature branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

After making changes:

```bash
npm run build
git add .
git commit -m "type(scope): describe the change"
git push -u origin feature/your-feature-name
```

Then create a pull request with:

- Base branch: `dev`.
- Compare branch: your feature branch.
- A clear description of the changes.
- Build and test results.

## Tech Stack

- NestJS.
- TypeScript.
- AWS Cognito.
- `jose` for JWT and JWKS validation.
- Axios for HTTP requests.
- Jest for testing.
- Docker-compatible Node.js service.

## License

Private - VidalStore EP1.