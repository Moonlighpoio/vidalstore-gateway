# VidalStore — API Gateway

API Gateway de la plataforma **VidalStore**. Es la única puerta de entrada entre el frontend Angular y los servicios backend: valida criptográficamente los JWT emitidos por **AWS Cognito** (firma contra el JWKS), aplica CORS y enruta las peticiones autenticadas hacia el **BFF**, reenviando los datos del usuario en headers.

VidalStore vende **licencias de uso de videojuegos digitales**: el usuario se autentica, navega el catálogo, compra y obtiene licencias en su biblioteca.

## Arquitectura

```text
Navegador (Angular)  :4200
      │  Authorization: Bearer <access token>
      ▼
API Gateway (NestJS) :8080   ← este repositorio (valida el JWT contra el JWKS)
      │  Authorization + x-user-sub + x-user-groups
      ▼
BFF (NestJS)         :3000   ← autoriza por grupo de Cognito
      │
      ▼
Catálogo :8001 ──────┘
Biblioteca :3003 ────────┘
```

El navegador solo conoce la URL del Gateway. Nunca llama directamente al BFF ni a los microservicios.

## Funcionalidad

- Validación de JWT de acceso **access token** de AWS Cognito.
- Verificación de firma mediante el **JWKS** del user pool (biblioteca `jose`).
- Validación de issuer, audience/`client_id`, `token_use`, expiración y clock-skew.
- Rutas protegidas con un guard de autenticación global sobre `/v1/*`.
- Configuración de **CORS** para el origen del frontend.
- Proxy hacia el BFF reenviando `x-user-sub` y `x-user-groups`.
- Logging estructurado de autenticación.
- Endpoint de health check público.
- Script AWS CLI para recrear el user pool de Cognito completo.

## Tecnologías

- NestJS + TypeScript.
- `jose` para verificación de JWT/JWKS.
- Axios para el proxy hacia el BFF.
- `@nestjs/config` para configuración.
- Jest (pruebas) y Oxlint (linting).
- AWS Cognito (user pool, app clients y grupos).
- Pruebas de seguridad con `curl`.

## Requisitos

- Node.js 18 o superior.
- npm.
- Un user pool y app client de AWS Cognito configurados.
- El servicio **BFF** de VidalStore corriendo.

## Instalación

```bash
git clone https://github.com/wsk4/vidalstore-gateway.git
cd vidalstore-gateway
npm install
```

Crea el archivo de entorno local:

```bash
cp .env.example .env
```

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del Gateway. | `8080` |
| `NODE_ENV` | Entorno de ejecución. | `development` |
| `COGNITO_USER_POOL_ID` | ID del user pool de Cognito. | — |
| `COGNITO_APP_CLIENT_ID` | ID del app client. | — |
| `COGNITO_REGION` | Región del user pool. | `us-east-1` |
| `COGNITO_ISSUER` | Issuer (`https://cognito-idp.amazonaws.com/<pool>`). | — |
| `COGNITO_AUDIENCE` | Audience/cliente esperado en el token. | — |
| `COGNITO_JWKS_URI` | URI del `/.well-known/jwks.json`. | — |
| `CORS_ORIGIN` | Origen permitido para el frontend. | `http://localhost:4200` |
| `BFF_URL` | URL base del BFF. | `http://localhost:3000` |

Nunca se versiona un `.env` con valores reales ni credenciales de AWS.

## Ejecución

```bash
npm run start:dev    # desarrollo con watch
npm run build        # compilación
npm run start:prod   # producción
```

El Gateway queda disponible en `http://localhost:8080`.

## Endpoints

> Todas las rutas `/v1/*` requieren `Authorization: Bearer <access token>`.

| Método | Ruta | Descripción | Proxy al BFF |
|---|---|---|---|
| `GET` | `/health` | Health check (público). | — |
| `GET` | `/v1/catalogo` | Lista el catálogo de juegos. | `GET /v1/catalogo` |
| `POST` | `/v1/catalogo` | Crea un juego. | `POST /v1/catalogo` |
| `PUT` | `/v1/catalogo/:id` | Actualiza un juego. | `PUT /v1/catalogo/:id` |
| `GET` | `/v1/biblioteca` | Biblioteca del usuario autenticado. | `GET /v1/biblioteca` |
| `POST` | `/v1/compras` | Crea una compra (licencia) para el usuario. | `POST /v1/compras` |
| `GET` | `/v1/licencias` | Lista todas las licencias (admin). | `GET /v1/licencias` |
| `DELETE` | `/v1/licencias/:licenciaId` | Revoca una licencia (admin). | `DELETE /v1/licencias/:id` |
| `GET` | `/v1/auditoria` | Historial de revocaciones (admin). | `GET /v1/auditoria` |

### Header de autorización

```http
Authorization: Bearer <access-token>
```

El Gateway resuelve el usuario desde el token y reenvía al BFF estos headers:

```http
Authorization: Bearer <access-token>
x-user-sub: <sub del token>
x-user-groups: jugadores,editores
```

### Ejemplos con curl

```bash
# Health (público) → 200
curl -i http://localhost:8080/health

# Sin token → 401
curl -i http://localhost:8080/v1/catalogo

# Token inválido → 401
curl -i -H "Authorization: Bearer mal.token.aqui" http://localhost:8080/v1/catalogo

# Esquema de autorización inválido → 401
curl -i -H "Authorization: Basic cached.credentials" http://localhost:8080/v1/catalogo

# Token válido → 200
curl -i -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:8080/v1/catalogo

# Jugador intentando revocar una licencia → 403 (decisión del BFF/microservicio)
curl -i -X DELETE -H "Authorization: Bearer $PLAYER_TOKEN" \
  http://localhost:8080/v1/licencias/lic-1

# Compra de un juego
curl -i -X POST -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gameId":"ftg-1"}' \
  http://localhost:8080/v1/compras
```

## Autenticación

El Gateway espera **access tokens** del user pool configurado. El flujo de validación:

1. Header `Authorization` presente.
2. Extracción del token `Bearer`.
3. Estructura de JWT (3 partes).
4. **Verificación de firma** contra el JWKS de Cognito.
5. Validación de **issuer** (`iss`).
6. Validación de **audience/client** (`aud`/`client_id`).
7. Validación de **tipo de token** (`token_use = access`).
8. Validación de **expiración** (`exp`) e iat con tolerancia de clock-skew.

## Recreación del user pool (AWS CLI)

El script `scripts/setup-cognito.sh` recrea desde cero todo el entorno de Cognito: user pool, dominio, resource server con los scopes `catalogo.leer`, `catalogo.escribir` y `biblioteca.leer`, el app client principal (Authorization Code + PKCE), un segundo app client de prueba ("otra aplicación"), los grupos `jugadores`, `editores` y `administradores`, los usuarios de prueba en sus grupos y el trigger **PostConfirmation**.

```bash
cd scripts
REGION=us-east-1 ./setup-cognito.sh
```

El trigger `scripts/post-confirmation` agrega automáticamente a cada usuario recién registrado al grupo `jugadores`.

## Códigos de respuesta

| Código | Significado | Cuándo se usa |
|---|---|---|
| `200 OK` | Éxito | Peticiones válidas. |
| `201 Created` | Recurso creado | `POST /v1/catalogo` y `POST /v1/compras`. |
| `401 Unauthorized` | No autenticado | Token ausente, malformado o inválido. |
| `403 Forbidden` | No autorizado | Rol insuficiente (resuelto por BFF/microservicio). |
| `404 Not Found` | No encontrado | Recurso inexistente. |
| `502 Bad Gateway` | BFF no disponible | Error de proxy sin respuesta. |

Estructura típica de error de autenticación:

```json
{
  "statusCode": 401,
  "timestamp": "2026-09-17T18:00:00.000Z",
  "path": "/v1/catalogo",
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

## Pruebas

```bash
npm test          # pruebas unitarias
npm run test:watch
npm run test:cov  # con cobertura
npm run test:e2e  # pruebas e2e
npm run lint      # oxlint
```

Las pruebas cubren la extracción del token, el validador JWT y el guard de autenticación.

## Scripts disponibles

```bash
npm run build        # compilar TypeScript
npm run start:dev    # desarrollo con watch
npm run start:prod   # producción
npm test             # pruebas unitarias
npm run test:e2e     # pruebas e2e
npm run lint         # oxlint
npm run format       # prettier
```

## Estructura del proyecto

```text
src/
├── auth/                    # AuthGuard, TokenValidator, JWKS resolver, extractor
├── common/
│   └── filters/             # AuthExceptionFilter
├── config/                  # configuration, cors.config
├── guards/                  # rate-limit.guard
├── logger/                  # AuthLoggerService
├── routes/
│   ├── auditoria/           # GET /v1/auditoria
│   ├── biblioteca/          # GET /v1/biblioteca, POST /v1/compras
│   ├── catalogo/            # GET/POST /v1/catalogo, PUT /v1/catalogo/:id
│   ├── health/              # GET /health
│   ├── licencias/           # GET /v1/licencias, DELETE /v1/licencias/:id
│   └── routes.module.ts
├── app.module.ts
└── main.ts

scripts/
├── setup-cognito.sh         # recreación del user pool con AWS CLI
└── post-confirmation/       # trigger Lambda PostConfirmation
```

## Flujo de ramas

```text
main ← dev ← feature/<nombre>
```

Crea las ramas desde `dev` y abre el Pull Request con base `dev`.

## Licencia

Proyecto académico DUOC UC — DSY1107 Desarrollo Cloud Native I.