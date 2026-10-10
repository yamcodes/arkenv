import type { SchemaShape } from "@repo/types";
import {
	applyBootGateWith,
	type BootGateRuntimeConfig,
	flattenRuntimeConfig,
} from "./boot-gate-apply";
import {
	type BootGateConfig,
	type BootGateEngine,
	buildSchemaJitiAliases,
	loadSchemaViaCapture,
} from "./boot-gate-load";
import { isBootGateDone, resetBootGateResultForTests } from "./boot-gate-state";
import { resolveCoreArkenv } from "./resolve-core-arkenv";

export type { BootGateConfig, BootGateEngine, BootGateRuntimeConfig };
export { buildSchemaJitiAliases, flattenRuntimeConfig, loadSchemaViaCapture };

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

export { applyCoercedToRuntimeConfig } from "./boot-gate-apply";

/**
 * Apply validation and coercion on live runtimeConfig for a given schema and public key set.
 *
 * Separable from file-system and Jiti schema capture, enabling isolated testing
 * and direct runtime application. Production Nitro boots call
 * {@link applyBootGateWith} with the schema compiled into the server bundle
 * instead of loading `schemaPath` here.
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
	const coreArkenv =
		Object.keys(schema).length === 0 ? () => ({}) : resolveCoreArkenv(engine);
	return applyBootGateWith(coreArkenv, schema, publicKeys, runtimeConfig);
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
