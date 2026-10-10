import { defineNitroPlugin, useRuntimeConfig } from "nitropack/runtime";
import { loadBundledSchema } from "#arkenv/schema";
import {
	applyCoercedToRuntimeConfig,
	type BootGateRuntimeConfig,
	cloneRuntimeConfig,
	projectPublicProcessEnv,
	runBundledBootGate,
} from "../boot-gate-apply";
import { getBootGateResult } from "../boot-gate-state";

const bundled = loadBundledSchema();
const publicKeys = new Set(bundled.publicKeys);
const liveConfig = cloneRuntimeConfig(
	useRuntimeConfig() as BootGateRuntimeConfig,
);
projectPublicProcessEnv(liveConfig, publicKeys);
runBundledBootGate(bundled, liveConfig);

const coerced = getBootGateResult();

/**
 * Nitro boot plugin: copy the coerced payload onto each request's runtime config.
 *
 * Validation runs when this module evaluates, which is before route modules load.
 * The schema comes from `#arkenv/schema`, not from a build-machine path.
 */
export default defineNitroPlugin((nitroApp) => {
	if (!coerced) return;

	nitroApp.hooks.hook("request", (event) => {
		const runtimeConfig = useRuntimeConfig(event) as BootGateRuntimeConfig;
		applyCoercedToRuntimeConfig(runtimeConfig, coerced, publicKeys);
	});
});
