import type { Dict, SchemaShape } from "@repo/types";
import {
	ENV_KEYS,
	EXTENDED_ENV,
	type FlatSchemaOptions,
	type LegacyNestedSchema,
	parseSchemaShape,
	type SchemaLayoutContext,
	SERVER_ONLY_KEYS,
} from "./schema-shape";

const CAPTURE_STATE_KEY = "__ARKENV_SCHEMA_CAPTURE__";

type CaptureState = {
	capturing: boolean;
	captures: CapturedSchemaCall[];
};

export type CaptureLegacyNested = LegacyNestedSchema;

export type CaptureFlatOptions = FlatSchemaOptions;

export type CapturedSchemaCall = {
	schemaOrOptions: SchemaShape | LegacyNestedSchema;
	optionsOrIsServer: FlatSchemaOptions | boolean | null | undefined;
	context: SchemaLayoutContext | undefined;
};

/**
 * Read the process-global capture state so Jiti-loaded copies share one flag.
 *
 * @returns The shared capture state bag
 */
function getCaptureState(): CaptureState {
	const g = globalThis as unknown as Record<string, CaptureState | undefined>;
	if (!g[CAPTURE_STATE_KEY]) {
		g[CAPTURE_STATE_KEY] = { capturing: false, captures: [] };
	}
	return g[CAPTURE_STATE_KEY];
}

/**
 * Start recording `arkenv()` schema arguments instead of reading runtime values.
 */
export function beginCapture(): void {
	const state = getCaptureState();
	state.capturing = true;
	state.captures = [];
}

/**
 * Stop recording and return the captured `arkenv()` calls.
 *
 * @returns The schema calls recorded since {@link beginCapture}
 */
export function endCapture(): CapturedSchemaCall[] {
	const state = getCaptureState();
	state.capturing = false;
	return state.captures.slice();
}

/**
 * Report whether schema capture mode is active.
 *
 * @returns `true` when {@link beginCapture} is in effect
 */
export function isCapturing(): boolean {
	return getCaptureState().capturing;
}

/**
 * Record an `arkenv()` call while capture mode is active.
 *
 * @param schemaOrOptions The schema definition or nested options object
 * @param optionsOrIsServer Flat options, legacy boolean, or undefined
 * @param context Optional server/client/strict-layout context
 */
export function recordCapture(
	schemaOrOptions: SchemaShape | LegacyNestedSchema | null | undefined,
	optionsOrIsServer: FlatSchemaOptions | boolean | null | undefined,
	context: SchemaLayoutContext | undefined,
): void {
	getCaptureState().captures.push({
		schemaOrOptions: (schemaOrOptions || {}) as
			| SchemaShape
			| LegacyNestedSchema,
		optionsOrIsServer,
		context,
	});
}

/**
 * Build a combined schema shape from captured `arkenv()` calls.
 *
 * @param calls The captured schema calls
 * @returns A flat schema object suitable for core validation
 */
export function combineCapturedSchemas(
	calls: CapturedSchemaCall[],
): SchemaShape {
	const combined: SchemaShape = {};

	for (const call of calls) {
		const parsed = parseSchemaShape(
			call.schemaOrOptions,
			call.optionsOrIsServer,
			call.context,
		);
		Object.assign(combined, parsed.server, parsed.client, parsed.shared);
	}

	return combined;
}

/**
 * Collect public (client + shared) key names from captured calls.
 *
 * @param calls The captured schema calls
 * @returns Keys that belong in `runtimeConfig.public`
 */
export function publicKeysFromCaptures(
	calls: CapturedSchemaCall[],
): Set<string> {
	const publicKeys = new Set<string>();

	for (const call of calls) {
		const parsed = parseSchemaShape(
			call.schemaOrOptions,
			call.optionsOrIsServer,
			call.context,
		);
		for (const key of parsed.publicKeys) {
			publicKeys.add(key);
		}
	}

	return publicKeys;
}

/**
 * Create a stub env proxy for capture-mode evaluation of user schema files.
 *
 * @param schemaKeys Keys declared by the captured schema
 * @returns A security-proxy-compatible stub object
 */
export function createCaptureStub(schemaKeys: string[]): unknown {
	const target: Dict<unknown> = {};
	const keySet = new Set(schemaKeys);

	return new Proxy(target, {
		get(_t, prop) {
			if (prop === EXTENDED_ENV) return target;
			if (prop === ENV_KEYS) return keySet;
			if (prop === SERVER_ONLY_KEYS) return new Set<string>();
			if (typeof prop === "symbol") return undefined;
			return undefined;
		},
		ownKeys() {
			return [...keySet];
		},
		getOwnPropertyDescriptor(_t, prop) {
			if (typeof prop === "string" && keySet.has(prop)) {
				return {
					configurable: true,
					enumerable: true,
					writable: false,
					value: undefined,
				};
			}
			return undefined;
		},
		has(_t, prop) {
			return typeof prop === "string" && keySet.has(prop);
		},
	});
}
