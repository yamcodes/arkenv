import type { EnvIssue } from "@repo/utils";
import { beginSchemaCapture, endSchemaCapture } from "@repo/utils";
import { createJiti } from "jiti";
import { declaredKeysFromDefinitions } from "@/features/schema-loader";
import {
	SCHEMA_LOAD_ERROR_CODES,
	type SchemaLoaderPort,
	type SchemaLoadResult,
	type SchemaLoadTarget,
	type SchemaValidationResult,
} from "@/shared/ports";
import {
	formatEvalThrowMessage,
	formatNoCallMessage,
	formatUnextractableMessage,
	formatUnsupportedMessage,
	isEnvValidationCause,
} from "./schema-load-errors";

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
	 * @returns Declared keys or a structured inspect error
	 */
	async load(target: SchemaLoadTarget): Promise<SchemaLoadResult> {
		beginSchemaCapture();
		try {
			this.evaluateModule(target.schemaPath);
			const definitions = endSchemaCapture();
			if (definitions.length === 0) {
				return {
					ok: false,
					code: SCHEMA_LOAD_ERROR_CODES.ERR_INSPECT_NO_CALL,
					message: formatNoCallMessage(target.schemaPath),
				};
			}
			const declared = declaredKeysFromDefinitions(definitions);
			if (!declared.extractable) {
				return {
					ok: false,
					code: SCHEMA_LOAD_ERROR_CODES.ERR_INSPECT_UNEXTRACTABLE,
					message: formatUnextractableMessage(target.schemaPath),
				};
			}
			return {
				ok: true,
				keys: declared.keys,
				schema: declared.schema,
			};
		} catch (cause) {
			endSchemaCapture();
			if (isEnvValidationCause(cause)) {
				return {
					ok: false,
					code: SCHEMA_LOAD_ERROR_CODES.ERR_INSPECT_UNSUPPORTED,
					message: formatUnsupportedMessage(target.schemaPath, cause),
					cause,
				};
			}
			return {
				ok: false,
				code: SCHEMA_LOAD_ERROR_CODES.ERR_INSPECT_EVAL_THROW,
				message: formatEvalThrowMessage(target.schemaPath, cause),
				cause,
			};
		}
	}

	/**
	 * Validate a resolved environment dictionary against the schema module.
	 *
	 * @param target The schema module to load and evaluate
	 * @param env The resolved environment dictionary to validate
	 * @returns Success or discriminated validation / load failure
	 */
	async validate(
		target: SchemaLoadTarget,
		env: Record<string, string | undefined>,
	): Promise<SchemaValidationResult> {
		const savedEnv = { ...process.env };
		for (const key of Object.keys(process.env)) {
			if (!(key in env) || env[key] === undefined) {
				delete process.env[key];
			}
		}
		for (const [key, value] of Object.entries(env)) {
			if (value !== undefined) {
				process.env[key] = value;
			}
		}

		try {
			this.evaluateModule(target.schemaPath);
			return { ok: true };
		} catch (cause) {
			if (isEnvValidationCause(cause)) {
				const issues =
					cause && typeof cause === "object" && "issues" in cause
						? ((cause as { issues?: EnvIssue[] }).issues ?? [])
						: [];
				const message = cause instanceof Error ? cause.message : String(cause);
				return {
					ok: false,
					kind: "validation",
					message,
					issues,
				};
			}

			return {
				ok: false,
				kind: "load",
				code: SCHEMA_LOAD_ERROR_CODES.ERR_INSPECT_EVAL_THROW,
				message: formatEvalThrowMessage(target.schemaPath, cause),
				cause,
			};
		} finally {
			for (const key of Object.keys(process.env)) {
				if (!(key in savedEnv)) {
					delete process.env[key];
				}
			}
			for (const [key, value] of Object.entries(savedEnv)) {
				if (value !== undefined) {
					process.env[key] = value;
				}
			}
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
