/**
 * post-confirmation.js — Trigger PostConfirmation de Amazon Cognito.
 *
 * Se ejecuta después de que un usuario confirma su registro en el user pool.
 * Agrega automáticamente al usuario nuevo al grupo "jugadores", sin intervención
 * manual (requisito de la EP1: "El registro deja usuario nuevo en jugadores").
 *
 * Despliegue (ver setup-cognito.sh):
 *   cd scripts/post-confirmation && npm install && zip -r ../post-confirmation.zip .
 *   aws lambda create-function --function-name vidalstore-post-confirmation \
 *     --runtime nodejs18.x --role arn:aws:iam::<ACCOUNT>:role/<ROLE> \
 *     --handler index.handler --zip-file fileb://post-confirmation.zip
 */

const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const GROUP_JUGADORES = 'jugadores';

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

exports.handler = async (event) => {
  if (
    event.triggerSource !== 'PostConfirmation_ConfirmSignUp' &&
    event.triggerSource !== 'PostConfirmation_AdminCreateUser'
  ) {
    return event;
  }

  const command = new AdminAddUserToGroupCommand({
    UserPoolId: event.userPoolId,
    Username: event.userName,
    GroupName: GROUP_JUGADORES,
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error(
      `No se pudo agregar a ${event.userName} al grupo ${GROUP_JUGADORES}`,
      error,
    );
    throw error;
  }

  return event;
};