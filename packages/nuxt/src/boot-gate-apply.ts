import type { Dict, SchemaShape } from "@repo/types";
import {
	getBootGateResult,
	isBootGateDone,
	setBootGateResult,
} from "./boot-gate-state";

/**
 * Validation engine the boot gate uses to coerce live values.
 */
export type BootGateEngine = "arktype" | "standard";

/**
 * Live Nitro runtime config passed through the boot gate.
 */
export type BootGateRuntimeConfig = {
	public?: Record<string, unknown>;
	arkenvGate?: {
		engine?: BootGateEngine;
	};
	[key: string]: unknown;
};

/**
 * Core `arkenv` function used to coerce a captured schema.
 */
export type CoreArkenv = (
	schema: SchemaShape,
	config?: { env?: Dict<string> },
) => Record<string, unknown>;

/**
 * Captured schema payload compiled into the Nitro server bundle.
 */
export type BundledSchemaModule = {
	schema: SchemaShape;
	publicKeys: string[];
	engine: BootGateEngine;
	coreArkenv: CoreArkenv;
};

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
 * Copy a runtime config so coercion can write without touching a frozen object.
 *
 * @param runtimeConfig Nitro's runtime config, which may be frozen
 * @returns A mutable deep copy
 */
export function cloneRuntimeConfig(
	runtimeConfig: BootGateRuntimeConfig,
): BootGateRuntimeConfig {
	return structuredClone(runtimeConfig);
}

/**
 * Project live `NUXT_PUBLIC_*` values onto `runtimeConfig.public`.
 *
 * Nitro maps `NUXT_DATABASE_URL` onto a top-level `DATABASE_URL`, but it does
 * not map `NUXT_PUBLIC_PORT` onto `runtimeConfig.public.NUXT_PUBLIC_PORT`.
 * Container env for those public keys, including a deliberate empty string,
 * is applied here before coercion.
 *
 * @param runtimeConfig Mutable runtime config
 * @param publicKeys Public schema keys
 */
export function projectPublicProcessEnv(
	runtimeConfig: BootGateRuntimeConfig,
	publicKeys: Set<string>,
): void {
	const env = typeof process !== "undefined" ? process.env : undefined;
	if (!env) return;

	runtimeConfig.public = runtimeConfig.public || {};
	for (const key of publicKeys) {
		const value = env[key];
		if (value !== undefined) {
			runtimeConfig.public[key] = value;
		}
	}
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
 * Coerce live runtime config with an already-resolved core `arkenv`.
 *
 * @param coreArkenv Engine entry (`@arkenv/core` or `@arkenv/standard`)
 * @param schema Flat schema object for core validation
 * @param publicKeys Keys that belong under `runtimeConfig.public`
 * @param runtimeConfig Live Nitro runtime config (mutated in place)
 * @returns Coerced values recorded in the boot-gate result
 * @throws When validation fails (fail-fast)
 */
export function applyBootGateWith(
	coreArkenv: CoreArkenv,
	schema: SchemaShape,
	publicKeys: Set<string>,
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

	const coerced = coreArkenv(schema, {
		env: combinedEnv as Dict<string>,
	});

	applyCoercedToRuntimeConfig(runtimeConfig, coerced, publicKeys);
	setBootGateResult({ ...coerced });
	return getBootGateResult() as Record<string, unknown>;
}

/**
 * Validate once from a schema already compiled into the server bundle.
 *
 * @param bundled Captured schema, public keys, and core entry
 * @param runtimeConfig Mutable live runtime config
 * @returns Coerced values
 * @throws When validation fails (fail-fast)
 */
export function runBundledBootGate(
	bundled: BundledSchemaModule,
	runtimeConfig: BootGateRuntimeConfig,
): Record<string, unknown> {
	if (isBootGateDone()) {
		return getBootGateResult() as Record<string, unknown>;
	}

	return applyBootGateWith(
		bundled.coreArkenv,
		bundled.schema,
		new Set(bundled.publicKeys),
		runtimeConfig,
	);
}
