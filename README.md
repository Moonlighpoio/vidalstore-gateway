# VidalStore Gateway

VidalStore Gateway is a NestJS API gateway that validates AWS Cognito JWT access tokens and proxies authorized requests to the VidalStore BFF.

## Architecture

```text
Angular Frontend
       |
       | Authorization: Bearer <access-token>
       v
VidalStore Gateway (NestJS, port 8080)
       |
       | JWT validation through AWS Cognito JWKS
       | Forwarded Authorization header
       v
VidalStore BFF (port 8081)
```

## Features

- Validates JWT access tokens issued by AWS Cognito
- Retrieves public signing keys from the Cognito JWKS endpoint
- Validates token issuer, audience, token use, expiration, and issued-at time
- Allows clock skew tolerance during token validation
- Protects routes with a NestJS authentication guard
- Configures CORS for the frontend origin
- Proxies requests to the VidalStore BFF
- Forwards the original `Authorization` header to the BFF

## Requirements

- Node.js 18 or newer
- npm
- AWS Cognito User Pool configuration
- VidalStore BFF running locally or reachable through `BFF_URL`

## Installation

Install the project dependencies:

```bash
npm install
```

## Environment Configuration

Create a `.env` file from the example file:

```bash
cp .env.example .env
```

Configure the following environment variables:

```bash
# Server
PORT=8080

# CORS
CORS_ORIGIN=http://localhost:4200

# BFF
BFF_URL=http://localhost:8081

# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
COGNITO_REGION=us-east-1
COGNITO_ISSUER=[https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX](https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX)
COGNITO_AUDIENCE=XXXXXXXXXXXXXXXXXXXXXXXXXX
COGNITO_JWKS_URI=[https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json](https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json)
```

Replace the placeholder values with your real AWS Cognito User Pool values.

## Running the Application

### Development mode

```bash
npm run start:dev
```

### Build

```bash
npm run build
```

### Production mode

```bash
npm run start:prod
```

The gateway runs by default at:

```text
http://localhost:8080
```

## Authentication

Protected endpoints require an AWS Cognito access token in the `Authorization` request header:

```http
Authorization: Bearer <access-token>
```

The gateway rejects requests when the token is missing, malformed, expired, signed with an unknown key, issued by an unexpected issuer, intended for a different audience, or not an access token.

## API Routes

| Method | Gateway route | BFF route | Description |
|---|---|---|---|
| `GET` | `/v1/catalogo` | `/v1/catalogo` | Returns the game catalog |
| `GET` | `/v1/biblioteca` | `/v1/biblioteca` | Returns the authenticated user's library |
| `POST` | `/v1/compras` | `/v1/compras` | Creates a purchase |
| `GET` | `/v1/licencias` | `/v1/licencias` | Returns licenses |
| `DELETE` | `/v1/licencias/:licenciaId` | `/v1/licencias/:licenciaId` | Revokes a license |

Authorization and role-specific access decisions for administrative operations are enforced by the BFF.

## Security Checks

### Request without a token

```bash
curl -i http://localhost:8080/v1/catalogo
```

Expected result:

```text
HTTP/1.1 401 Unauthorized
```

### Request with an invalid token

```bash
curl -i \
  -H "Authorization: Bearer invalid.token.here" \
  http://localhost:8080/v1/catalogo
```

Expected result:

```text
HTTP/1.1 401 Unauthorized
```

### Request with a valid access token

```bash
curl -i \
  -H "Authorization: Bearer <access-token>" \
  http://localhost:8080/v1/catalogo
```

Expected result: the gateway validates the token and forwards the request to the BFF.

## Technology Stack

- NestJS
- TypeScript
- `jose` for JWT and JWKS validation
- Axios for BFF HTTP proxy requests
- AWS Cognito for authentication

## License

Private project — VidalStore.