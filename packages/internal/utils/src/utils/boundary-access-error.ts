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

/**
 * Build a native `Error` for a client read of a server-only key.
 *
 * Not an `ArkEnvValidationError` instance: client-generated modules must stay
 * import-free of the class, and there are no `EnvIssue`s. Leave `name` as `"Error"`
 * so the overlay matches a framework tripwire.
 *
 * @param key The server-only environment variable name
 * @returns A native `Error` with the boundary access message
 */
export function createBoundaryAccessError(key: string): Error {
	return new Error(boundaryAccessErrorMessage(key));
}
