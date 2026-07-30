/**
 * Shared boot-gate result state.
 *
 * Kept free of `@arkenv/core` / `@arkenv/standard` imports so client entries can
 * read coerced values without pulling the validator into the browser bundle.
 */

let gateResult: Record<string, unknown> | null = null;
let gateDone = false;

/**
 * Store the flattened coerced values from a successful boot-gate run.
 *
 * @param values Coerced env values
 */
export function setBootGateResult(values: Record<string, unknown>): void {
	gateResult = values;
	gateDone = true;
}

/**
 * Return coerced values produced by the last successful boot gate run.
 *
 * @returns Flattened coerced env values, or `null` if the gate has not run
 */
export function getBootGateResult(): Record<string, unknown> | null {
	return gateResult;
}

/**
 * Report whether the boot gate has completed.
 *
 * @returns `true` when the gate has already run successfully
 */
export function isBootGateDone(): boolean {
	return gateDone;
}

/**
 * Reset boot-gate result state (tests only).
 */
export function resetBootGateResultForTests(): void {
	gateResult = null;
	gateDone = false;
}
