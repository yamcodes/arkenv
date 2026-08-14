/**
 * `error.name` for the validation class {@link ArkEnvValidationError}.
 */
export const ARKENV_VALIDATION_ERROR_NAME = "ArkEnvValidationError";

/**
 * Build the attributed message for a client read of a server-only env key.
 *
 * Native `Error` (name stays `"Error"`). Attribution is grammatical
 * (`… was prevented by ArkEnv`) so the brand is last, not a sticker.
 *
 * @param key The server-only environment variable name
 * @returns The boundary access error message
 */
export function boundaryAccessErrorMessage(key: string): string {
	return `Access to server-only key '${key}' on the client was prevented by ArkEnv`;
}
