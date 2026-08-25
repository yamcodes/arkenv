const SCHEMA_CAPTURE_KEY = "__ARKENV_SCHEMA_CAPTURE__";

type SchemaCaptureState = {
	capturing: boolean;
	definitions: unknown[];
};

/**
 * Read the process-global schema-capture bag so separately loaded copies of
 * `@arkenv/core` / `@arkenv/standard` (for example via Jiti) share one flag.
 *
 * @returns The shared capture state
 */
function getSchemaCaptureState(): SchemaCaptureState {
	const globals = globalThis as unknown as Record<
		string,
		SchemaCaptureState | undefined
	>;
	if (!globals[SCHEMA_CAPTURE_KEY]) {
		globals[SCHEMA_CAPTURE_KEY] = { capturing: false, definitions: [] };
	}
	return globals[SCHEMA_CAPTURE_KEY];
}

/**
 * Start recording `arkenv()` schema arguments instead of validating the environment.
 *
 * CLI-supporting API: tools such as the ArkEnv CLI use this to inspect a user's
 * schema module without requiring `process.env` to be populated.
 */
export function beginSchemaCapture(): void {
	const state = getSchemaCaptureState();
	state.capturing = true;
	state.definitions = [];
}

/**
 * Stop recording and return the captured `arkenv()` schema definitions.
 *
 * @returns Schema definitions recorded since {@link beginSchemaCapture}
 */
export function endSchemaCapture(): unknown[] {
	const state = getSchemaCaptureState();
	state.capturing = false;
	const definitions = state.definitions.slice();
	state.definitions = [];
	return definitions;
}

/**
 * Report whether schema capture mode is active.
 *
 * @returns `true` when {@link beginSchemaCapture} is in effect
 */
export function isCapturingSchema(): boolean {
	return getSchemaCaptureState().capturing;
}

/**
 * Record an `arkenv()` schema definition while capture mode is active.
 *
 * @param def The schema definition passed to `arkenv()`
 */
export function recordSchemaCapture(def: unknown): void {
	const state = getSchemaCaptureState();
	if (state.capturing) {
		state.definitions.push(def);
	}
}
