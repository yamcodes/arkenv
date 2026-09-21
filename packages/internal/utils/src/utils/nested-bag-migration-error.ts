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
	return (
		"The nested arkenv({ server, client, shared, runtimeEnv }) API has been removed. " +
		"Use flat arkenv(schema, { exposeToClient, runtimeEnv }) instead. " +
		`See ${NESTED_BAG_MIGRATION_URL}`
	);
}

/**
 * Build the migration error message for the removed `expose` / `shared` aliases.
 *
 * @returns The expose-alias migration error message
 */
export function removedExposeAliasErrorMessage(): string {
	return (
		"The expose and shared option aliases have been removed. " +
		"Use exposeToClient instead. " +
		`See ${NESTED_BAG_MIGRATION_URL}`
	);
}

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
 * Report whether a value looks like a nested schema bag (not a flat env validator).
 *
 * Flat ArkType keys are strings; flat Standard Schema keys expose `~standard`.
 * Nested bags are plain objects of validators without that marker, or an ArkType
 * `type({…})` instance (a function) wrapping a whole bucket.
 *
 * @param value The value to test
 * @returns `true` when the value is a nested bag object or ArkType type instance
 */
function isSchemaBag(value: unknown): boolean {
	if (typeof value === "function") {
		return true;
	}
	return isPlainObject(value) && !isStandardSchemaLike(value);
}

/**
 * Report whether options still use the removed `expose` / `shared` aliases.
 *
 * @param options The second `arkenv()` argument
 * @returns `true` when a removed alias key is present
 */
export function hasRemovedExposeAlias(options: unknown): boolean {
	if (!isPlainObject(options)) {
		return false;
	}
	return "expose" in options || "shared" in options;
}

/**
 * Report whether a call matches the removed nested bag API.
 *
 * Value-aware for the first argument so a flat env key literally named
 * `server` / `client` / `shared` / `runtimeEnv` is not misclassified when its
 * value is a string or Standard Schema. A boolean second argument was the
 * internal legacy dispatch signal and is also rejected.
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
 * Throw when a call still uses the removed nested bag API or expose aliases.
 *
 * @param schemaOrOptions The first `arkenv()` argument
 * @param optionsOrIsServer The second `arkenv()` argument
 * @throws An error with migration instructions when a removed API is detected
 */
export function assertNotNestedBag(
	schemaOrOptions: unknown,
	optionsOrIsServer?: unknown,
): void {
	if (isNestedBagCall(schemaOrOptions, optionsOrIsServer)) {
		throw new Error(nestedBagMigrationErrorMessage());
	}
	if (hasRemovedExposeAlias(optionsOrIsServer)) {
		throw new Error(removedExposeAliasErrorMessage());
	}
}

/**
 * Detect nested bag blocks in schema source (`server: { … }`, `client: type(…)`, etc.).
 *
 * Distinguishes flat env keys named `server` / `client` / `shared` (string or
 * Standard Schema expressions) from nested object bags and `type(` / `z.object(`
 * wrappers. Not comment/string-aware — a literal `server: {` inside a comment
 * can false-positive.
 *
 * @param schemaArg The first-argument source text of an `arkenv()` / `createEnv()` call
 * @returns `true` when a nested bag block is present
 */
export function hasNestedBagSource(schemaArg: string): boolean {
	return /\b(?:server|client|shared)\s*:\s*(?:\{|[A-Za-z_$][\w$]*\s*\()/.test(
		schemaArg,
	);
}

/**
 * Detect removed `expose` / `shared` option aliases in options source text.
 *
 * @param optionsArg The second-argument source text of an `arkenv()` call
 * @returns `true` when a removed alias is present
 */
export function hasRemovedExposeAliasSource(optionsArg: string): boolean {
	return (
		/\bexpose(?!ToClient)\s*:\s*\[/.test(optionsArg) ||
		/\bshared\s*:\s*\[/.test(optionsArg)
	);
}

/**
 * Throw when schema source still uses the removed nested bag API.
 *
 * @param schemaArg The first-argument source text of an `arkenv()` / `createEnv()` call
 * @throws An error with migration guidance when a nested bag block is detected
 */
export function assertNotNestedBagSource(schemaArg: string): void {
	if (hasNestedBagSource(schemaArg)) {
		throw new Error(nestedBagMigrationErrorMessage());
	}
}

/**
 * Throw when options source still uses the removed `expose` / `shared` aliases.
 *
 * @param optionsArg The second-argument source text of an `arkenv()` call
 * @throws An error with migration guidance when a removed alias is detected
 */
export function assertNotRemovedExposeAliasSource(optionsArg: string): void {
	if (hasRemovedExposeAliasSource(optionsArg)) {
		throw new Error(removedExposeAliasErrorMessage());
	}
}
