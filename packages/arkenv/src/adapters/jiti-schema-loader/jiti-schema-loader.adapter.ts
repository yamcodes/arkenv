import { beginSchemaCapture, endSchemaCapture } from "@repo/utils";
import { createJiti } from "jiti";
import { declaredKeysFromDefinitions } from "@/features/schema-loader";
import {
	SCHEMA_LOAD_ERROR_CODES,
	type SchemaLoaderPort,
	type SchemaLoadResult,
	type SchemaLoadTarget,
} from "@/shared/ports";

export type JitiSchemaLoaderOptions = {
	/**
	 * Optional Jiti aliases (for example pointing `@arkenv/core` at workspace source)
	 */
	jitiAliases?: Record<string, string>;
};

/**
 * Load a TypeScript schema module with Jiti and capture `arkenv()` definitions.
 */
export class JitiSchemaLoaderAdapter implements SchemaLoaderPort {
	constructor(private readonly options: JitiSchemaLoaderOptions = {}) {}

	/**
	 * Import the schema module under capture mode and return declared keys.
	 *
	 * @param target The schema module to load
	 * @returns Declared keys or a structured error
	 */
	async load(target: SchemaLoadTarget): Promise<SchemaLoadResult> {
		beginSchemaCapture();
		try {
			this.evaluateModule(target.schemaPath);
			const definitions = endSchemaCapture();
			if (definitions.length === 0) {
				return {
					ok: false,
					code: SCHEMA_LOAD_ERROR_CODES.NO_SCHEMA,
					message: `No arkenv() schema definition was found in "${target.schemaPath}".`,
				};
			}
			const declared = declaredKeysFromDefinitions(definitions);
			return {
				ok: true,
				keys: declared.keys,
				schema: declared.schema,
			};
		} catch (cause) {
			endSchemaCapture();
			const message = cause instanceof Error ? cause.message : String(cause);
			return {
				ok: false,
				code: SCHEMA_LOAD_ERROR_CODES.MODULE_LOAD_FAILED,
				message: `Failed to load schema module at "${target.schemaPath}": ${message}`,
				cause,
			};
		}
	}

	/**
	 * Evaluate the schema file with Jiti, retrying without tsconfig paths on miss.
	 *
	 * @param schemaPath Absolute path to the schema module
	 */
	private evaluateModule(schemaPath: string): void {
		const jitiOptions = {
			moduleCache: false,
			fsCache: false,
			tsconfigPaths: true,
			...(this.options.jitiAliases ? { alias: this.options.jitiAliases } : {}),
		} as const;

		try {
			createJiti(schemaPath, jitiOptions)(schemaPath);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			const isTsconfigNotFound =
				error instanceof Error &&
				/tsconfig/i.test(message) &&
				(/not found/i.test(message) ||
					(error as NodeJS.ErrnoException).code === "ENOENT");

			if (!isTsconfigNotFound) {
				throw error;
			}
			createJiti(schemaPath, {
				...jitiOptions,
				tsconfigPaths: false,
			})(schemaPath);
		}
	}
}
