const MIGRATION_GUIDE_URL = "https://arkenv.js.org/docs/guides/migrating-to-v1";

/**
 * Migration-oriented error for schema files still using the removed nested bag API.
 */
export const REMOVED_NESTED_BAG_MESSAGE =
	"The nested arkenv({ server, client, shared, runtimeEnv }) API has been removed. " +
	"Use flat arkenv(schema, { exposeToClient, runtimeEnv }) instead. " +
	`See ${MIGRATION_GUIDE_URL}`;

/**
 * Detect nested bag blocks in schema source (`server: { … }`, etc.).
 *
 * Distinguishes flat env keys named `server` / `client` / `shared` (string or
 * validator expressions) from nested object bags.
 *
 * @param schemaArg The first-argument source text of an `arkenv()` / `createEnv()` call
 * @returns `true` when a nested bag block is present
 */
export function hasRemovedNestedBagSource(schemaArg: string): boolean {
	return /\b(?:server|client|shared)\s*:\s*\{/.test(schemaArg);
}

/**
 * Throw when schema source still uses the removed nested bag API.
 *
 * @param schemaArg The first-argument source text of an `arkenv()` / `createEnv()` call
 * @throws An error with migration guidance when a nested bag block is detected
 */
export function assertNotRemovedNestedBagSource(schemaArg: string): void {
	if (hasRemovedNestedBagSource(schemaArg)) {
		throw new Error(REMOVED_NESTED_BAG_MESSAGE);
	}
}
