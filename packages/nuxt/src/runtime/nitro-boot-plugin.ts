import { defineNitroPlugin, useRuntimeConfig } from "nitropack/runtime";
import {
	type BootGateConfig,
	type BootGateRuntimeConfig,
	configureBootGate,
	ensureBootGate,
} from "../boot-gate";

/**
 * Nitro boot plugin: coerce schema keys into `runtimeConfig` after string overrides.
 *
 * Registered by `@arkenv/nuxt/module`. This is the single `createEnv` moment for
 * Nuxt — thin `arkenv()` accessors only read the coerced payload afterward.
 */
export default defineNitroPlugin(() => {
	const runtimeConfig = useRuntimeConfig() as BootGateRuntimeConfig;
	const gate = runtimeConfig.arkenvGate as BootGateConfig | undefined;

	if (gate?.schemaPath) {
		configureBootGate(gate);
		ensureBootGate(runtimeConfig);
	}
});
