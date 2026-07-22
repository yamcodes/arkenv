import type { Dict, SchemaShape } from "@repo/types";

/** Matches {@link EXTENDED_ENV} in arkenv-internal without importing it (avoid cycles). */
const EXTENDED_ENV = Symbol.for("arkenv.extended_env");
/** Matches {@link ENV_KEYS} in arkenv-internal without importing it (avoid cycles). */
const ENV_KEYS = Symbol.for("arkenv.keys");
/** Matches {@link SERVER_ONLY_KEYS} in arkenv-internal without importing it (avoid cycles). */
const SERVER_ONLY_KEYS = Symbol.for("arkenv.server_only_keys");

const CAPTURE_STATE_KEY = "__ARKENV_SCHEMA_CAPTURE__";

type CaptureState = {
	capturing: boolean;
	captures: CapturedSchemaCall[];
};

export type CaptureLegacyNested = {
	server?: SchemaShape;
	client?: SchemaShape;
	shared?: SchemaShape;
	extends?: readonly unknown[];
	runtimeEnv?: Dict<string>;
};

export type CaptureFlatOptions = {
	extends?: readonly unknown[];
	runtimeEnv?: Dict<string>;
	expose?: readonly string[];
	shared?: readonly string[];
	exposeToClient?: readonly string[];
};

export type CapturedSchemaCall = {
	schemaOrOptions: SchemaShape | CaptureLegacyNested;
	optionsOrIsServer: CaptureFlatOptions | boolean | null | undefined;
	context:
		| {
				isServer: boolean;
				isShared?: boolean;
				strictLayout?: "client" | "server";
		  }
		| undefined;
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
	schemaOrOptions: SchemaShape | CaptureLegacyNested | null | undefined,
	optionsOrIsServer: CaptureFlatOptions | boolean | null | undefined,
	context:
		| {
				isServer: boolean;
				isShared?: boolean;
				strictLayout?: "client" | "server";
		  }
		| undefined,
): void {
	getCaptureState().captures.push({
		schemaOrOptions: (schemaOrOptions || {}) as
			| SchemaShape
			| CaptureLegacyNested,
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
		Object.assign(combined, schemaFromCapture(call));
	}

	return combined;
}

/**
 * Derive a flat schema shape from a single captured call.
 *
 * @param call The captured `arkenv()` invocation
 * @returns Schema keys contributed by that call
 */
function schemaFromCapture(call: CapturedSchemaCall): SchemaShape {
	const { schemaOrOptions, optionsOrIsServer } = call;

	if (typeof optionsOrIsServer === "boolean") {
		const legacy = schemaOrOptions as CaptureLegacyNested;
		return {
			...(legacy.server || {}),
			...(legacy.client || {}),
			...(legacy.shared || {}),
		} as SchemaShape;
	}

	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		("runtimeEnv" in schemaOrOptions ||
			"server" in schemaOrOptions ||
			"client" in schemaOrOptions ||
			"shared" in schemaOrOptions);

	if (isLegacy) {
		const legacy = schemaOrOptions as CaptureLegacyNested;
		return {
			...(legacy.server || {}),
			...(legacy.client || {}),
			...(legacy.shared || {}),
		} as SchemaShape;
	}

	return (schemaOrOptions || {}) as SchemaShape;
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
		const { schemaOrOptions, optionsOrIsServer, context } = call;

		if (typeof optionsOrIsServer === "boolean") {
			const legacy = schemaOrOptions as CaptureLegacyNested;
			for (const key of Object.keys(legacy.client || {})) publicKeys.add(key);
			for (const key of Object.keys(legacy.shared || {})) publicKeys.add(key);
			continue;
		}

		const isLegacy =
			schemaOrOptions &&
			typeof schemaOrOptions === "object" &&
			("server" in schemaOrOptions ||
				"client" in schemaOrOptions ||
				"shared" in schemaOrOptions);

		if (isLegacy) {
			const legacy = schemaOrOptions as CaptureLegacyNested;
			for (const key of Object.keys(legacy.client || {})) publicKeys.add(key);
			for (const key of Object.keys(legacy.shared || {})) publicKeys.add(key);
			continue;
		}

		const flat = (schemaOrOptions || {}) as SchemaShape;
		const options = (optionsOrIsServer || {}) as CaptureFlatOptions;

		if (context?.isShared || context?.strictLayout === "client") {
			for (const key of Object.keys(flat)) publicKeys.add(key);
			continue;
		}

		if (context?.strictLayout === "server") {
			continue;
		}

		const exposed =
			options.exposeToClient || options.expose || options.shared || [];
		for (const key of Object.keys(flat)) {
			if (
				exposed.includes(key) ||
				key === "NODE_ENV" ||
				key.startsWith("NUXT_PUBLIC_")
			) {
				publicKeys.add(key);
			}
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
