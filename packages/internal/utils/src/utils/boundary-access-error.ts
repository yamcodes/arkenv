/**
 * `error.name` for the validation class {@link ArkEnvValidationError}.
 */
export const ARKENV_VALIDATION_ERROR_NAME = "ArkEnvValidationError";

/**
 * `error.name` for branded boundary access throws (native `Error`, no class).
 */
export const ARKENV_ACCESS_ERROR_NAME = "ArkEnvAccessError";

/**
 * Build the unprefixed message for a client read of a server-only env key.
 *
 * @param key The server-only environment variable name
 * @returns The boundary access error message
 */
export function boundaryAccessErrorMessage(key: string): string {
	return `Attempted to access server environment variable '${key}' on the client.`;
}

/**
 * Build a native `Error` branded as `ArkEnvAccessError` for a client read of a server-only key.
 *
 * Not an `ArkEnvValidationError` instance: client-generated modules must stay
 * import-free of the class, and there are no `EnvIssue`s. Set `name` immediately so
 * V8/JSC format the stack as `ArkEnvAccessError:` (ADR 0024).
 *
 * @param key The server-only environment variable name
 * @returns A native `Error` with `name` set to {@link ARKENV_ACCESS_ERROR_NAME}
 */
export function createBoundaryAccessError(key: string): Error {
	const error = new Error(boundaryAccessErrorMessage(key));
	error.name = ARKENV_ACCESS_ERROR_NAME;
	return error;
}
