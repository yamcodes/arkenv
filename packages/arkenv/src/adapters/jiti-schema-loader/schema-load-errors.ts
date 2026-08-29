export const CAPTURE_NO_CALL_HINT =
	"No arkenv() definition was found. Ensure arkenv() is called at the top level of the schema module.";

export const CAPTURE_UPGRADE_HINT =
	"Upgrade @arkenv/core or @arkenv/standard so the CLI can inspect the schema without validating the environment.";

export const CAPTURE_UNEXTRACTABLE_HINT =
	"Cannot extract keys from the captured definition. Ensure the schema is a supported static map.";

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
 * Build an ERR_INSPECT_NO_CALL error message.
 *
 * @param schemaPath Absolute path to the schema module
 * @returns The structured error message
 */
export function formatNoCallMessage(schemaPath: string): string {
	return `No arkenv() schema definition was found in "${schemaPath}". ${CAPTURE_NO_CALL_HINT}`;
}

/**
 * Build an ERR_INSPECT_UNSUPPORTED error message for runtimes that ignore capture.
 *
 * @param schemaPath Absolute path to the schema module
 * @param cause The thrown value
 * @returns The structured error message
 */
export function formatUnsupportedMessage(
	schemaPath: string,
	cause: unknown,
): string {
	const detail = cause instanceof Error ? cause.message : String(cause);
	return `Failed to inspect schema module at "${schemaPath}": ${detail} ${CAPTURE_UPGRADE_HINT}`;
}

/**
 * Build an ERR_INSPECT_UNEXTRACTABLE error message.
 *
 * @param schemaPath Absolute path to the schema module
 * @returns The structured error message
 */
export function formatUnextractableMessage(schemaPath: string): string {
	return `Failed to inspect schema module at "${schemaPath}": ${CAPTURE_UNEXTRACTABLE_HINT}`;
}

/**
 * Build an ERR_INSPECT_EVAL_THROW error message with a contextual hint.
 *
 * @param schemaPath Absolute path to the schema module
 * @param cause The thrown value
 * @returns The structured error message
 */
export function formatEvalThrowMessage(
	schemaPath: string,
	cause: unknown,
): string {
	const detail = cause instanceof Error ? cause.message : String(cause);
	const prefix = `Failed to load schema module at "${schemaPath}": ${detail}`;
	if (
		isCaptureStubReadCause(cause) ||
		/missing [A-Z_][A-Z0-9_]*/.test(detail)
	) {
		return `${prefix} ${CAPTURE_CONTRACT_HINT}`;
	}
	return prefix;
}
