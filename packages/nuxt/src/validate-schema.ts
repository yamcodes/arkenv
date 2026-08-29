import type { Dict } from "@repo/types";
import { type BootGateEngine, loadSchemaViaCapture } from "./boot-gate-load";
import { resolveCoreArkenv } from "./resolve-core-arkenv";

/**
 * Validate the project schema at build/dev time by loading schema via capture
 * and calling core directly against the build environment.
 *
 * @param schemaPath Absolute path to the schema file
 * @param internalOptions Optional engine / Jiti alias overrides
 */
export function validateSchema(
	schemaPath: string,
	internalOptions?: {
		_jitiAliases?: Record<string, string>;
		engine?: BootGateEngine;
	},
): void {
	const engine = internalOptions?.engine ?? "arktype";
	const { schema } = loadSchemaViaCapture(
		{
			schemaPath,
			engine,
		},
		internalOptions,
	);

	if (Object.keys(schema).length === 0) {
		return;
	}

	const coreArkenv = resolveCoreArkenv(engine);
	coreArkenv(schema, {
		env: (typeof process !== "undefined" ? process.env : {}) as Dict<string>,
		safe: false,
	});
}
