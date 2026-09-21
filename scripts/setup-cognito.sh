#!/usr/bin/env bash
#
# setup-cognito.sh — Recrea el user pool de Amazon Cognito para VidalStore desde cero.
#
# Crea, en orden:
#   1. User pool                        (sign-up público, email verificado)
#   2. Dominio de la aplicación         (Hosted UI)
#   3. Resource server + scopes         (vidalstore/catalogo.leer, catalogo.escribir, biblioteca.leer)
#   4. App client principal             (VidalStore Web — Authorization Code + PKCE)
#   5. Segundo app client               (otra aplicación — para la prueba "token de otra app")
#   6. Grupos                          (jugadores, editores, administradores)
#   7. Usuarios de prueba en sus grupos
#   8. Trigger PostConfirmation         (Lambda que agrega al grupo "jugadores")
#
# Uso:
#   REGION=us-east-1 ./scripts/setup-cognito.sh
#
# Requiere: AWS CLI v2 instalado y credenciales configuradas
#   (aws configure > Credentials, o variable AWS_PROFILE).
#
# Para empezar desde cero con seguridad: si ya existe un user pool "vidalstore-pool",
# elimínalo primero con:
#   aws cognito-idp list-user-pools --max-results 60
#   aws cognito-idp delete-user-pool --user-pool-id <ID>     # (opcional con --force-alias)
#

set -euo pipefail

# ============================== Configuración ==============================
REGION="${REGION:-us-east-1}"
POOL_NAME="${POOL_NAME:-vidalstore-pool}"
DOMAIN_PREFIX="${DOMAIN_PREFIX:-vidalstore}"
RESOURCE_SERVER="${RESOURCE_SERVER:-vidalstore}"
APP_CLIENT_NAME="${APP_CLIENT_NAME:-vidalstore-app}"
AUX_CLIENT_NAME="${AUX_CLIENT_NAME:-vidalstore-OtraAplicacion}"

# Callbacks de la aplicación (Hosted UI). Para SSO del navegador angular.
APP_CALLBACK_URL="${APP_CALLBACK_URL:-http://localhost:4200}"          # o https://TU_HOST/procesar-inicio-sesion
APP_LOGOUT_URL="${APP_LOGOUT_URL:-http://localhost:4200}"              # o https://TU_HOST/cerrar-sesion
CALLBACK_PATHS="${CALLBACK_PATHS:-/callback http://localhost:4200/callback /login http://localhost:4200/login}"

# Usuarios de prueba (¡cámbialos!)
ADMIN_USER="${ADMIN_USER:-admin@vidalstore.cl}"
EDITOR_USER="${EDITOR_USER:-editor@vidalstore.cl}"
JUGADOR_USER="${JUGADOR_USER:-jugador@vidalstore.cl}"
TEMP_PASSWORD="${TEMP_PASSWORD:-Temporal%12345}"

PROFILE_ARGS=()
if [[ -n "${AWS_PROFILE:-}" ]]; then
  PROFILE_ARGS=(--profile "$AWS_PROFILE")
fi

# ============================== 1. User pool ==============================
echo "==> Creando user pool: ${POOL_NAME}"
USER_POOL_ID="$(
  aws cognito-idp create-user-pool \
    "${PROFILE_ARGS[@]}" \
    --region "$REGION" \
    --pool-name "$POOL_NAME" \
    --alias-attributes email preferred_username \
    --username-attributes email \
    --auto-verified-attributes email \
    --schema '[{"Name":"email","AttributeDataType":"String","Required":true,"Mutable":true}]' \
    --admin-create-user-config '{"AllowAdminCreateUserOnly":false,"UnusedAccountValidityDays":7}' \
    --mfa-configuration OPTIONAL \
    --email-configuration '{"EmailSendingAccount":"COGNITO_DEFAULT"}' \
    --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":true}}' \
    --query 'UserPool.Id' --output text
)"
echo "   User Pool ID: ${USER_POOL_ID}"

# ============================== 2. Dominio ==============================
echo "==> Creando dominio: ${DOMAIN_PREFIX}.auth.${REGION}.amazoncognito.com"
aws cognito-idp create-user-pool-domain \
  "${PROFILE_ARGS[@]}" \
  --region "$REGION" \
  --domain "$DOMAIN_PREFIX" \
  --user-pool-id "$USER_POOL_ID"

# ============================== 3. Resource server + scopes ==============================
echo "==> Creando resource server '${RESOURCE_SERVER}' con scopes"
aws cognito-idp create-resource-server \
  "${PROFILE_ARGS[@]}" \
  --region "$REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --identifier "$RESOURCE_SERVER" \
  --name "VidalStore API" \
  --scopes '[{"ScopeName":"catalogo.leer","ScopeDescription":"Leer el catalogo de juegos"},{"ScopeName":"catalogo.escribir","ScopeDescription":"Crear o editar juegos en el catalogo"},{"ScopeName":"biblioteca.leer","ScopeDescription":"Leer la biblioteca de juegos del usuario"}]'

# ============================== 4. App client principal ==============================
echo "==> Creando app client: ${APP_CLIENT_NAME} (Authorization Code + PKCE)"
APP_CLIENT_ID="$(
  aws cognito-idp create-user-pool-client \
    "${PROFILE_ARGS[@]}" \
    --region "$REGION" \
    --user-pool-id "$USER_POOL_ID" \
    --client-name "$APP_CLIENT_NAME" \
    --no-generate-secret \
    --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
    --allowed-o-auth-flows code \
    --allowed-o-auth-scopes "openid" "email" "profile" "${RESOURCE_SERVER}/catalogo.leer" "${RESOURCE_SERVER}/catalogo.escribir" "${RESOURCE_SERVER}/biblioteca.leer" \
    --callback-urls "$APP_CALLBACK_URL" \
    --logout-urls "$APP_LOGOUT_URL" \
    --supported-identity-providers COGNITO \
    --precision 15 \
    --query 'UserPoolClient.ClientId' --output text
)"
echo "   App Client Id: ${APP_CLIENT_ID}"

# ============================== 5. Segundo app client (token de otra app) ==============================
echo "==> Creando app client auxiliar: ${AUX_CLIENT_NAME}"
AUX_CLIENT_ID="$(
  aws cognito-idp create-user-pool-client \
    "${PROFILE_ARGS[@]}" \
    --region "$REGION" \
    --user-pool-id "$USER_POOL_ID" \
    --client-name "$AUX_CLIENT_NAME" \
    --no-generate-secret \
    --explicit-auth-flows "ALLOW_REFRESH_TOKEN_AUTH" \
    --allowed-o-auth-flows code \
    --allowed-o-auth-scopes "openid" "email" \
    --callback-urls "$APP_CALLBACK_URL" \
    --logout-urls "$APP_LOGOUT_URL" \
    --supported-identity-providers COGNITO \
    --query 'UserPoolClient.ClientId' --output text
)"
echo "   Aux App Client Id: ${AUX_CLIENT_ID}"

# ============================== 6. Grupos ==============================
echo "==> Creando grupos: jugadores, editores, administradores"
for GROUP in jugadores editores administradores; do
  aws cognito-idp create-group \
    "${PROFILE_ARGS[@]}" \
    --region "$REGION" \
    --user-pool-id "$USER_POOL_ID" \
    --group-name "$GROUP"
done

# ============================== 7. Usuarios de prueba ==============================
echo "==> Creando usuarios de prueba"

create_user_and_add_to_group() {
  local username="$1"
  local group="$2"
  local domain="${username##*@}"

  aws cognito-idp admin-create-user \
    "${PROFILE_ARGS[@]}" \
    --region "$REGION" \
    --user-pool-id "$USER_POOL_ID" \
    --username "$username" \
    --temporary-password "$TEMP_PASSWORD" \
    --message-action SUPPRESS \
    --user-attributes "Name=email,Value=${username}" >/dev/null

  # Fija una contraseña permanente y agrega al grupo
  aws cognito-idp admin-set-user-password \
    "${PROFILE_ARGS[@]}" \
    --region "$REGION" \
    --user-pool-id "$USER_POOL_ID" \
    --username "$username" \
    --password "$TEMP_PASSWORD" \
    --permanent

  aws cognito-idp admin-add-user-to-group \
    "${PROFILE_ARGS[@]}" \
    --region "$REGION" \
    --user-pool-id "$USER_POOL_ID" \
    --username "$username" \
    --group-name "$group" >/dev/null

  echo "   ${username} -> ${group}"
}

create_user_and_add_to_group "$ADMIN_USER"   "administradores"
create_user_and_add_to_group "$EDITOR_USER"  "editores"
create_user_and_add_to_group "$JUGADOR_USER" "jugadores"

# ============================== 8. Trigger PostConfirmation ==============================
echo "==> (Paso manual) Trigger PostConfirmation para el grupo 'jugadores'"
echo "   El registro deja al usuario nuevo en el grupo 'jugadores' sin intervención"
echo "   manual usando el trigger PostConfirmation (ver scripts/post-confirmation.js)."
echo "   Pasos:"
echo "     cd scripts && npm pack post-confirmation.js 2>/dev/null || true"
echo "     aws lambda create-function --function-name vidalstore-post-confirmation \\"
echo "         --runtime nodejs18.x --role arn:aws:iam::<ACCOUNT>:role/<LAMBDA_ROLE> \\"
echo "         --handler index.handler --zip-file fileb://post-confirmation.zip"
echo "     aws lambda add-permission --function-name vidalstore-post-confirmation \\"
echo "         --statement-id allow-cognito --action lambda:InvokeFunction \\"
echo "         --principal cognito-idp.amazonaws.com --source-arn arn:aws:cognito-idp:${REGION}:<ACCOUNT>:userpool/${USER_POOL_ID}"
echo "     aws cognito-idp update-user-pool --user-pool-id ${USER_POOL_ID} \\"
echo "         --lambda-config PostConfirmation=arn:aws:lambda:${REGION}:<ACCOUNT>:function:vidalstore-post-confirmation"

echo ""
echo "========================================================================"
echo " Resumen de configuracion (guardalo en tus .env)"
echo "========================================================================"
echo "REGION=${REGION}"
echo "COGNITO_USER_POOL_ID=${USER_POOL_ID}"
echo "COGNITO_APP_CLIENT_ID=${APP_CLIENT_ID}"
echo "COGNITO_DOMAIN=${DOMAIN_PREFIX}.auth.${REGION}.amazoncognito.com"
echo "Segundo app client (prueba 'token de otra app'): ${AUX_CLIENT_ID}"
echo "========================================================================"