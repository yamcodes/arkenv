import type { Dict, SchemaShape } from "@repo/types";
import {
	type BootGateConfig,
	type BootGateEngine,
	buildSchemaJitiAliases,
	loadSchemaViaCapture,
} from "./boot-gate-load";
import {
	getBootGateResult,
	isBootGateDone,
	resetBootGateResultForTests,
	setBootGateResult,
} from "./boot-gate-state";
import { resolveCoreArkenv } from "./resolve-core-arkenv";

export type { BootGateConfig, BootGateEngine };
export { buildSchemaJitiAliases, loadSchemaViaCapture };

export type BootGateRuntimeConfig = {
	public?: Record<string, unknown>;
	arkenvGate?: BootGateConfig;
	[key: string]: unknown;
};

let gateConfig: BootGateConfig | null = null;

export {
	getBootGateResult,
	isBootGateDone,
} from "./boot-gate-state";

/**
 * Store boot-gate configuration for {@link ensureBootGate}.
 *
 * @param config Schema path, layout, and validation engine
 */
export function configureBootGate(config: BootGateConfig): void {
	gateConfig = config;
}

/**
 * Return the current boot-gate configuration, if any.
 *
 * @returns The configured gate options, or `null`
 */
export function getBootGateConfig(): BootGateConfig | null {
	return gateConfig;
}

/**
 * Reset boot-gate state (tests only).
 */
export function resetBootGateForTests(): void {
	gateConfig = null;
	resetBootGateResultForTests();
}

/**
 * Flatten Nuxt `runtimeConfig` into a single key→value map for validation.
 *
 * @param runtimeConfig The live Nitro runtime config (after string overrides)
 * @returns Flat env map including public keys at the top level
 */
export function flattenRuntimeConfig(
	runtimeConfig: BootGateRuntimeConfig,
): Record<string, unknown> {
	const { public: publicConfig, arkenvGate: _gate, ...rest } = runtimeConfig;
	const flat: Record<string, unknown> = { ...rest };
	if (publicConfig && typeof publicConfig === "object") {
		Object.assign(flat, publicConfig);
	}
	return flat;
}

/**
 * Write coerced values back into `runtimeConfig`, including `public`.
 *
 * @param runtimeConfig The live Nitro runtime config to mutate
 * @param coerced Validated/coerced values from core
 * @param publicKeys Keys that belong under `runtimeConfig.public`
 */
export function applyCoercedToRuntimeConfig(
	runtimeConfig: BootGateRuntimeConfig,
	coerced: Record<string, unknown>,
	publicKeys: Set<string>,
): void {
	runtimeConfig.public = runtimeConfig.public || {};

	for (const [key, value] of Object.entries(coerced)) {
		if (publicKeys.has(key)) {
			runtimeConfig.public[key] = value;
		} else {
			runtimeConfig[key] = value;
		}
	}
}

/**
 * Apply validation and coercion on live runtimeConfig for a given schema and public key set.
 *
 * Separable from file-system and Jiti schema capture, enabling isolated testing
 * and direct runtime application.
 *
 * @param schema Flat schema object for core validation
 * @param publicKeys Set of public keys to route to runtimeConfig.public
 * @param engine Validation engine ("arktype" | "standard")
 * @param runtimeConfig Live Nitro runtime config (mutated in place)
 * @returns Coerced values recorded in the boot-gate result
 * @throws When validation fails (fail-fast)
 */
export function applyBootGate(
	schema: SchemaShape,
	publicKeys: Set<string>,
	engine: BootGateEngine,
	runtimeConfig: BootGateRuntimeConfig,
): Record<string, unknown> {
	if (Object.keys(schema).length === 0) {
		const flat = flattenRuntimeConfig(runtimeConfig);
		setBootGateResult(flat);
		return flat;
	}

	const sourceValues = flattenRuntimeConfig(runtimeConfig);
	const processEnv =
		typeof process !== "undefined" ? (process.env as Dict<string>) : {};

	// `runtimeConfig` after Nitro boot is authoritative — including deliberate empty
	// string overrides (`NUXT_PUBLIC_FOO=""`). Spread `process.env` first as a
	// fallback for keys Nitro has not projected into config yet.
	const combinedEnv: Record<string, unknown> = { ...processEnv };
	for (const [key, value] of Object.entries(sourceValues)) {
		if (value !== undefined) {
			combinedEnv[key] = value;
		}
	}

	const coreArkenv = resolveCoreArkenv(engine);
	const coerced = coreArkenv(schema, {
		env: combinedEnv as Dict<string>,
		safe: false,
	});

	applyCoercedToRuntimeConfig(runtimeConfig, coerced, publicKeys);
	setBootGateResult({ ...coerced });
	return getBootGateResult() as Record<string, unknown>;
}

/**
 * Run the Nuxt boot gate: capture schema, validate/coerce against live config, write back.
 *
 * @param config Schema path and engine
 * @param runtimeConfig Live Nitro runtime config (mutated in place)
 * @param internalOptions Optional Jiti overrides for tests
 * @returns Flattened coerced values
 * @throws When validation fails (fail-fast)
 */
export function runBootGate(
	config: BootGateConfig,
	runtimeConfig: BootGateRuntimeConfig,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): Record<string, unknown> {
	const { schema, publicKeys } = loadSchemaViaCapture(config, internalOptions);
	return applyBootGate(schema, publicKeys, config.engine, runtimeConfig);
}

/**
 * Ensure the boot gate has run once (eager plugin + thin server accessor).
 *
 * Reads `arkenvGate` from `runtimeConfig` when {@link configureBootGate} was not called.
 * No-ops when neither config nor a usable runtimeConfig gate block is available.
 *
 * @param runtimeConfig Optional live runtime config (from Nitro plugin / tests)
 */
export function ensureBootGate(runtimeConfig?: BootGateRuntimeConfig): void {
	if (isBootGateDone()) return;

	const config =
		gateConfig ||
		(runtimeConfig?.arkenvGate as BootGateConfig | undefined) ||
		null;

	if (!config?.schemaPath) {
		return;
	}

	const rc =
		runtimeConfig ||
		({
			public: {},
		} as BootGateRuntimeConfig);

	if (!rc.arkenvGate) {
		rc.arkenvGate = config;
	}

	configureBootGate(config);
	runBootGate(config, rc);
}
