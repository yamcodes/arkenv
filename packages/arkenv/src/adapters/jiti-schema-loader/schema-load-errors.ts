export const CAPTURE_UPGRADE_HINT =
	"If this file calls arkenv(), upgrade @arkenv/core or @arkenv/standard so the CLI can inspect the schema without validating the environment.";

export const CAPTURE_CONTRACT_HINT =
	"Capture mode does not populate env values. Keep the schema module declarative (`export const env = arkenv({...})`) and do not read `env` at module scope.";

/**
 * Report whether a thrown value looks like ArkEnv environment validation.
 *
 * @param cause The thrown value from loading the schema module
 * @returns `true` when the cause is an ArkEnv validation failure
 */
export function isEnvValidationCause(cause: unknown): boolean {
	if (
		cause &&
		typeof cause === "object" &&
		"name" in cause &&
		(cause as { name?: string }).name === "ArkEnvError"
	) {
		return true;
	}
	const message = cause instanceof Error ? cause.message : String(cause);
	return /validating environment variables/i.test(message);
}

/**
 * Report whether a thrown value looks like a read of the capture stub.
 *
 * @param cause The thrown value from loading the schema module
 * @returns `true` when the cause looks like an undefined env read
 */
export function isCaptureStubReadCause(cause: unknown): boolean {
	if (!(cause instanceof Error) && typeof cause !== "object") {
		return /cannot read propert/i.test(String(cause));
	}
	const message = cause instanceof Error ? cause.message : String(cause);
	return (
		/cannot read propert/i.test(message) ||
		cause instanceof TypeError ||
		/is not a function/i.test(message)
	);
}

/**
 * Build a NO_SCHEMA error message, including an upgrade hint for version skew.
 *
 * @param schemaPath Absolute path to the schema module
 * @returns The structured error message
 */
export function formatNoSchemaMessage(schemaPath: string): string {
	return `No arkenv() schema definition was found in "${schemaPath}". ${CAPTURE_UPGRADE_HINT}`;
}

/**
 * Build a MODULE_LOAD_FAILED error message with a contextual hint.
 *
 * @param schemaPath Absolute path to the schema module
 * @param cause The thrown value
 * @returns The structured error message
 */
export function formatModuleLoadFailedMessage(
	schemaPath: string,
	cause: unknown,
): string {
	const detail = cause instanceof Error ? cause.message : String(cause);
	const prefix = `Failed to load schema module at "${schemaPath}": ${detail}`;
	if (isEnvValidationCause(cause)) {
		return `${prefix} ${CAPTURE_UPGRADE_HINT}`;
	}
	if (isCaptureStubReadCause(cause)) {
		return `${prefix} ${CAPTURE_CONTRACT_HINT}`;
	}
	if (/missing [A-Z_][A-Z0-9_]*/.test(detail)) {
		return `${prefix} ${CAPTURE_CONTRACT_HINT}`;
	}
	return prefix;
}
