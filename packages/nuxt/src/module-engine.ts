import type { BootGateEngine } from "./boot-gate";

let defaultEngine: BootGateEngine = "arktype";

/**
 * Set the default boot-gate engine for the next module setup (Standard module).
 *
 * @param engine ArkType or Standard Schema engine
 */
export function setDefaultBootGateEngine(engine: BootGateEngine): void {
	defaultEngine = engine;
}

/**
 * Return the default boot-gate engine for module setup.
 *
 * @returns The configured engine
 */
export function getDefaultBootGateEngine(): BootGateEngine {
	return defaultEngine;
}
