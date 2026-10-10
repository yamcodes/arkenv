/**
 * Satisfy the thin accessor hook without loading a schema.
 *
 * Coercion already ran in the Nitro boot plugin from the schema compiled into
 * the server bundle. Calling this again must not read a file or start jiti.
 */
export function ensureBootGate(): void {}
