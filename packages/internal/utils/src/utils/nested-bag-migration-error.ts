/**
 * Migration guide URL for the nested-bag removal.
 */
export const NESTED_BAG_MIGRATION_URL =
	"https://arkenv.js.org/docs/guides/migrating-to-v1";

/**
 * Build the migration error message for the removed nested bag API.
 *
 * @returns The nested-bag migration error message
 */
export function nestedBagMigrationErrorMessage(): string {
	return `The nested arkenv({ server, client, shared, runtimeEnv }) bag was removed. Use flat arkenv(schema, { exposeToClient }) instead. See ${NESTED_BAG_MIGRATION_URL}`;
}

/**
 * Report whether a value looks like the removed nested bag first argument
 * or the legacy boolean second argument.
 *
 * Lowercase bucket keys (`server` / `client` / `shared` / `runtimeEnv`) are
 * reserved; env-var names are uppercase by convention.
 *
 * @param schemaOrOptions The first `arkenv()` argument
 * @param optionsOrIsServer The second `arkenv()` argument
 * @returns `true` when the call matches the removed nested bag shape
 */
export function isNestedBagCall(
	schemaOrOptions: unknown,
	optionsOrIsServer?: unknown,
): boolean {
	if (typeof optionsOrIsServer === "boolean") {
		return true;
	}
	return Boolean(
		schemaOrOptions &&
			typeof schemaOrOptions === "object" &&
			("runtimeEnv" in schemaOrOptions ||
				"server" in schemaOrOptions ||
				"client" in schemaOrOptions ||
				"shared" in schemaOrOptions),
	);
}

/**
 * Throw when a call still uses the removed nested bag API.
 *
 * @param schemaOrOptions The first `arkenv()` argument
 * @param optionsOrIsServer The second `arkenv()` argument
 * @throws An error with migration instructions when the nested bag is detected
 */
export function assertNotNestedBag(
	schemaOrOptions: unknown,
	optionsOrIsServer?: unknown,
): void {
	if (isNestedBagCall(schemaOrOptions, optionsOrIsServer)) {
		throw new Error(nestedBagMigrationErrorMessage());
	}
}
