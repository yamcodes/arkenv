/**
 * `error.name` for the validation class {@link ArkEnvError}.
 */
export const ARKENV_ERROR_NAME = "ArkEnvError";

/**
 * Build the message for a client read of a server-only env key.
 *
 * Native `Error` (name stays `"Error"`). Next.js taint voice
 * (`Do not … since it will leak`) plus a last-place breadcrumb
 * (`(prevented by ArkEnv)`) so agents can attribute the throw.
 * No trailing period. Shared across Next, Nuxt, Vite, and Bun —
 * "on the client", not "Client Components".
 *
 * @param key The server-only environment variable name
 * @returns The boundary access error message
 */
export function boundaryAccessErrorMessage(key: string): string {
	return `Do not access server-only key '${key}' on the client since it will leak sensitive data (prevented by ArkEnv)`;
}
