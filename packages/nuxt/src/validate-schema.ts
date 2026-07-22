import { createRequire } from "node:module";
import type { Dict, SchemaShape } from "@repo/types";
import type { BootGateEngine } from "./boot-gate";
import { loadSchemaViaCapture } from "./boot-gate";

const require = createRequire(import.meta.url);
type CoreArkenv = (
	schema: SchemaShape,
	config?: { env?: Dict<string>; safe?: boolean },
) => Record<string, unknown>;

/**
 * Resolve the core validation function for the configured engine.
 *
 * @param engine ArkType (`@arkenv/core`) or Standard Schema (`@arkenv/standard`)
 * @returns The engine's `arkenv` function
 */
function resolveCoreArkenv(engine: BootGateEngine): CoreArkenv {
	if (engine === "standard") {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("@arkenv/standard").arkenv as CoreArkenv;
	}
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require("@arkenv/core").arkenv as CoreArkenv;
}

/**
 * Validate the project schema at build/dev time by loading schema via capture
 * and calling core directly against the build environment.
 *
 * @param schemaPath Absolute path to the schema file or directory
 * @param resolvedLayout Detected or configured layout mode
 * @param baseDir Strict-layout env directory, or empty for flat layout
 * @param internalOptions Optional engine / Jiti alias overrides
 */
export function validateSchema(
	schemaPath: string,
	resolvedLayout: "simple" | "strict",
	baseDir: string,
	internalOptions?: {
		_jitiAliases?: Record<string, string>;
		engine?: BootGateEngine;
	},
): void {
	const engine = internalOptions?.engine ?? "arktype";
	const { schema } = loadSchemaViaCapture(
		{
			schemaPath,
			layout: resolvedLayout,
			baseDir,
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
