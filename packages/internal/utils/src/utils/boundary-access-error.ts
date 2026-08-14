/**
 * `error.name` for the validation class {@link ArkEnvValidationError}.
 */
export const ARKENV_VALIDATION_ERROR_NAME = "ArkEnvValidationError";

/**
 * Build the message for a client read of a server-only env key.
 *
 * Native `Error` (name stays `"Error"`). Same shape as Next.js taint copy:
 * `Do not … since it will leak sensitive data`. No trailing period.
 * Shared across Next, Nuxt, Vite, and Bun — "on the client", not
 * "Client Components".
 *
 * @param key The server-only environment variable name
 * @returns The boundary access error message
 */
export function boundaryAccessErrorMessage(key: string): string {
	return `Do not access server-only key '${key}' on the client since it will leak sensitive data`;
}
