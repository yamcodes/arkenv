/**
 * `error.name` for validation `ArkEnvError` and branded boundary access throws.
 */
export const ARKENV_ERROR_NAME = "ArkEnvError";

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
 * Build a native `Error` branded as `ArkEnvError` for a client read of a server-only key.
 *
 * Not an `ArkEnvError` instance: client-generated modules must stay import-free of the class.
 *
 * @param key The server-only environment variable name
 * @returns A native `Error` with `name` set to {@link ARKENV_ERROR_NAME}
 */
export function createBoundaryAccessError(key: string): Error {
	const error = new Error(boundaryAccessErrorMessage(key));
	error.name = ARKENV_ERROR_NAME;
	return error;
}
