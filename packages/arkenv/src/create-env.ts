import { $ } from "@repo/scope";
import type { InferType, StandardSchemaV1 } from "@repo/types";
import type { Type } from "arktype";
import { ArkEnvError, type EnvIssue } from "./errors";
import { coerce } from "./utils/coerce";

/**
 * The configuration for the ArkEnv library.
 */
export type ArkEnvConfig = {
	env?: Record<string, string | undefined>;
	coerce?:
		| boolean
		| {
				numbers?: boolean;
				booleans?: boolean;
				objects?: boolean;
		  };
	onUndeclaredKey?: "ignore" | "reject" | "delete";
	arrayFormat?: "comma" | "json";
};

/**
 * A flexible schema definition that can be a raw object, compiled ArkType,
 * or a Standard Schema validator.
 */
type SchemaShape = any;

function detectValidatorType(def: unknown): {
	isArkCompiled: boolean;
	isStandard: boolean;
} {
	const isArkCompiled = isArktype(def);
	const isStandard =
		!isArkCompiled && (def as StandardSchemaV1)?.["~standard"] !== undefined;

	return { isArkCompiled, isStandard };
}

/**
 * Detects if a definition is an ArkType validator.
 *
 * MAINTAINER NOTE: This is best-effort detection for ArkType 2.0.
 * Future ArkType internals could shift; fallback behavior should ensure
 * we error cleanly if detection fails but a validator is actually required.
 * Do not promise this logic as public contract.
 */
function isArktype(def: unknown): boolean {
	if (typeof def !== "function" && (typeof def !== "object" || def === null)) {
		return false;
	}

	const defAny = def as any;

	// ArkType 2.0 markers or our own lazy proxy
	if (
		defAny.isArktype === true ||
		defAny.arkKind === "type" ||
		defAny.arkKind === "generic" ||
		defAny.arkKind === "module"
	) {
		return true;
	}

	// ArkType 2.0 often has these internal ones
	return (
		typeof defAny.traverseApply === "function" &&
		typeof defAny.traverseAllows === "function" &&
		defAny.json !== undefined
	);
}

function isArkErrors(result: unknown): boolean {
	if (!result || typeof result !== "object") return false;

	const arkKind = (result as any).arkKind;
	return (
		arkKind === "errors" ||
		("byPath" in (result as any) && "count" in (result as any))
	);
}

function validateArkType(
	def: unknown,
	config: ArkEnvConfig,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: EnvIssue[] } {
	const { isArkCompiled: isCompiledType } = detectValidatorType(def);

	let schema = isCompiledType
		? (def as Type)
		: ($.type(def as any) as unknown as Type);

	// Apply undeclared key policy if specified or needed
	if (config.onUndeclaredKey) {
		schema = (schema as any).onUndeclaredKey(config.onUndeclaredKey);
	} else if (!isCompiledType) {
		// Default behavior for mappings: strip extra keys unless explicitly ignored
		schema = (schema as any).onUndeclaredKey("delete");
	}

	const coercionConfig = {
		numbers:
			config.coerce === false
				? false
				: typeof config.coerce === "object"
					? (config.coerce.numbers ?? true)
					: true,
		booleans:
			config.coerce === false
				? false
				: typeof config.coerce === "object"
					? (config.coerce.booleans ?? true)
					: true,
		objects:
			config.coerce === false
				? false
				: typeof config.coerce === "object"
					? (config.coerce.objects ?? true)
					: true,
		arrayFormat: config.arrayFormat ?? "comma",
	};

	const coercedEnv = coerce(schema, env, coercionConfig as any);

	const result = schema(coercedEnv);

	if (isArkErrors(result)) {
		const issues: EnvIssue[] = [];
		const errors = result as any;
		if (errors.byPath) {
			for (const [path, error] of Object.entries(errors.byPath)) {
				issues.push({
					path: path.split("."),
					message: (error as any).message,
				});
			}
		} else {
			// Fallback
			issues.push({ path: ["root"], message: String(result) });
		}

		return { success: false, issues };
	}

	return { success: true, value: result as any };
}

function validateStandardSchemaMapping(
	mapping: Record<string, StandardSchemaV1>,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: EnvIssue[] } {
	const result: Record<string, unknown> = {};
	const allIssues: EnvIssue[] = [];

	for (const [key, validator] of Object.entries(mapping)) {
		const value = env[key];
		const validationResult = validator["~standard"].validate(value);

		if (validationResult instanceof Promise) {
			throw new Error("Async validation is not supported in createEnv.");
		}

		if (validationResult.issues) {
			for (const stdIssue of validationResult.issues) {
				allIssues.push({
					path: [key, ...(stdIssue.path || [])].map(String),
					message: stdIssue.message,
				});
			}
		} else {
			result[key] = validationResult.value;
		}
	}

	if (allIssues.length > 0) {
		return { success: false, issues: allIssues };
	}

	return { success: true, value: result };
}

function detectMappingType(mapping: SchemaShape): {
	type: "arktype" | "standard-schema";
} {
	let hasStandard = false;
	let hasArktype = false;

	for (const value of Object.values(mapping)) {
		if (typeof value === "string" || isArktype(value)) {
			hasArktype = true;
		} else if ((value as any)?.["~standard"]) {
			hasStandard = true;
		}
	}

	// Prioritize ArkType detection: if anything identifies as ArkType,
	// we use the ArkType path which handles both ArkType and Standard Schema
	// (via $.type wrapping).
	if (hasArktype) return { type: "arktype" };
	if (hasStandard) return { type: "standard-schema" };

	return { type: "arktype" };
}

/**
 * Validates environment variables against a schema and returns the parsed result.
 *
 * {@link https://arkenv.js.org | ArkEnv} is a typesafe environment variables validator from editor to runtime.
 *
 * @param def - The schema definition (ArkType mapping, compiled ArkType, or Standard Schema mapping)
 * @param config - Optional configuration for validation and coercion
 * @returns The validated and parsed environment variables
 * @throws {ArkEnvError} If validation fails
 */
export function createEnv<const T extends SchemaShape>(
	def: T,
	config: ArkEnvConfig = {},
): InferType<T> {
	const env = config.env ?? process.env;

	const { isArkCompiled, isStandard } = detectValidatorType(def);

	if (isArkCompiled) {
		const result = validateArkType(def, config, env);
		if (!result.success) {
			throw new ArkEnvError(result.issues as any);
		}
		return result.value as InferType<T>;
	}

	if (isStandard) {
		throw new Error(
			"ArkEnv expects a mapping of environment variables to validators, not a top-level Standard Schema (like a Zod object). Please pass an object instead, e.g. createEnv({ PORT: z.string() }).",
		);
	}

	const mappingType = detectMappingType(def as SchemaShape);

	const result =
		mappingType.type === "standard-schema"
			? validateStandardSchemaMapping(def as SchemaShape, env)
			: validateArkType(def, config, env);

	if (!result.success) {
		// Use result.issues which is mapped from ArkErrors if needed
		throw new ArkEnvError(result.issues as any);
	}

	return result.value as InferType<T>;
}

export default createEnv;
