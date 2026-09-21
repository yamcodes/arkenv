const MIGRATION_GUIDE_URL = "https://arkenv.js.org/docs/guides/migrating-to-v1";

/**
 * Migration-oriented error for callers still using the removed nested bag API.
 */
export const REMOVED_NESTED_BAG_MESSAGE =
	"The nested arkenv({ server, client, shared, runtimeEnv }) API has been removed. " +
	"Use flat arkenv(schema, { exposeToClient, runtimeEnv }) instead. " +
	`See ${MIGRATION_GUIDE_URL}`;

/**
 * Report whether a value is a plain object (not an array or null).
 *
 * @param value The value to test
 * @returns `true` when the value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Report whether a value looks like a single Standard Schema validator.
 *
 * @param value The value to test
 * @returns `true` when the value exposes a `~standard` property
 */
function isStandardSchemaLike(value: unknown): boolean {
	return isPlainObject(value) && "~standard" in value;
}

/**
 * Report whether a value looks like a nested schema bag (not a single validator).
 *
 * Flat ArkType keys are strings; flat Standard Schema keys expose `~standard`.
 * Nested bags are plain objects of validators without that marker.
 *
 * @param value The value to test
 * @returns `true` when the value is a nested bag object
 */
function isSchemaBag(value: unknown): boolean {
	return isPlainObject(value) && !isStandardSchemaLike(value);
}

/**
 * Detect the removed nested `arkenv({ server, client, shared, runtimeEnv })` call shape.
 *
 * Value-aware: a flat env key literally named `server` / `client` / `shared` /
 * `runtimeEnv` is not treated as nested when its value is a string or Standard Schema.
 *
 * @param schemaOrOptions The first argument passed to `arkenv()`
 * @returns `true` when the argument matches the removed nested bag form
 */
export function isRemovedNestedBag(schemaOrOptions: unknown): boolean {
	if (!isPlainObject(schemaOrOptions)) {
		return false;
	}

	for (const key of ["server", "client", "shared"] as const) {
		if (key in schemaOrOptions && isSchemaBag(schemaOrOptions[key])) {
			return true;
		}
	}

	// Nested form put `runtimeEnv` on the first argument; flat puts it on options.
	if (
		"runtimeEnv" in schemaOrOptions &&
		isSchemaBag(schemaOrOptions.runtimeEnv)
	) {
		return true;
	}

	return false;
}

/**
 * Throw when the first `arkenv()` argument uses the removed nested bag API.
 *
 * @param schemaOrOptions The first argument passed to `arkenv()`
 * @throws An error with migration guidance when the nested bag form is detected
 */
export function assertNotRemovedNestedBag(schemaOrOptions: unknown): void {
	if (isRemovedNestedBag(schemaOrOptions)) {
		throw new Error(REMOVED_NESTED_BAG_MESSAGE);
	}
}
