import type { SchemaShape } from "@repo/types";
import type { BootGateEngine } from "./boot-gate-apply";
import {
	beginCapture,
	combineCapturedSchemas,
	endCapture,
	publicKeysFromCaptures,
} from "./capture";

/** Nitro virtual module that exports the captured schema. */
export const ARKENV_SCHEMA_VIRTUAL_ID = "#arkenv/schema";

/** Nitro virtual module that turns capture on before the schema evaluates. */
export const ARKENV_SCHEMA_PRELUDE_ID = "#arkenv/schema-capture-prelude";

const ENGINE_PACKAGE: Record<BootGateEngine, string> = {
	arktype: "@arkenv/core",
	standard: "@arkenv/standard",
};

/**
 * Arm schema capture before the bundled user schema evaluates.
 */
export function beginBundledCapture(): void {
	beginCapture();
}

/**
 * Read the schema and public keys recorded while capture mode was on.
 *
 * @returns Combined schema and public key names
 */
export function readCapturedSchema(): {
	schema: SchemaShape;
	publicKeys: string[];
} {
	const calls = endCapture();
	return {
		schema: combineCapturedSchemas(calls),
		publicKeys: [...publicKeysFromCaptures(calls)],
	};
}

/**
 * Build the Nitro virtual modules that inline the user schema.
 *
 * The prelude import is first so capture mode is on before the schema module
 * evaluates. The schema import uses a capture id so it is not the same module
 * as the app's `env` proxy.
 *
 * @param options Schema file, engine, capture module id, and the capture runtime file
 * @returns Virtual module id → source
 */
export function createBundledSchemaVirtualModules(options: {
	engine: BootGateEngine;
	captureRuntimePath: string;
	captureModuleId: string;
}): Record<string, string> {
	const captureId = options.captureModuleId;
	const enginePackage = ENGINE_PACKAGE[options.engine];

	const prelude = `
import { beginBundledCapture, readCapturedSchema } from ${JSON.stringify(options.captureRuntimePath)};
beginBundledCapture();
export { readCapturedSchema };
export const engine = ${JSON.stringify(options.engine)};
`;

	const schema = `
import { readCapturedSchema, engine } from ${JSON.stringify(ARKENV_SCHEMA_PRELUDE_ID)};
import * as schemaModule from ${JSON.stringify(captureId)};
import { arkenv as coreArkenv } from ${JSON.stringify(enginePackage)};

const captured = (() => {
	if (schemaModule == null) {
		throw new Error("ArkEnv schema module failed to evaluate.");
	}
	return readCapturedSchema();
})();

export function loadBundledSchema() {
	return {
		schema: captured.schema,
		publicKeys: captured.publicKeys,
		engine,
		coreArkenv,
	};
}
`;

	return {
		[ARKENV_SCHEMA_PRELUDE_ID]: prelude,
		[ARKENV_SCHEMA_VIRTUAL_ID]: schema,
	};
}
