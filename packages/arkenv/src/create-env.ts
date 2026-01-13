import { $ } from "@repo/scope";
import type { StandardSchemaV1 } from "@repo/types";
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

type SchemaShape = Record<string, unknown>;

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

	return { success: true, value: result };
}

function validateStandardSchemaMapping(
	def: SchemaShape,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: EnvIssue[] } {
	const value: Record<string, unknown> = {};
	const issues: EnvIssue[] = [];

	for (const [key, validator] of Object.entries(def)) {
		const result = (validator as StandardSchemaV1)["~standard"].validate(
			env[key],
		);

		if (result instanceof Promise) {
			throw new Error("ArkEnv does not support asynchronous validators");
		}

		if (result.issues) {
			for (const issue of result.issues) {
				issues.push({
					path: [key],
					message: issue.message,
				});
			}
		} else {
			value[key] = result.value;
		}
	}

	if (issues.length > 0) {
		return { success: false, issues };
	}

	return { success: true, value };
}

function detectMappingType(def: SchemaShape): {
	type: "standard-schema" | "arktype";
} {
	let hasStandardSchema = false;
	let hasArktype = false;

	for (const validator of Object.values(def)) {
		if (isArktype(validator)) {
			hasArktype = true;
			break;
		}
		if ((validator as StandardSchemaV1)?.["~standard"]) {
			hasStandardSchema = true;
		} else {
			hasArktype = true;
			break;
		}
	}

	if (hasArktype) {
		return { type: "arktype" };
	}

	if (hasStandardSchema) {
		return { type: "standard-schema" };
	}

	return { type: "arktype" };
}

export function createEnv<const T extends SchemaShape>(
	def: T,
	config: ArkEnvConfig = {},
): any {
	const env = config.env ?? process.env;

	const { isArkCompiled, isStandard } = detectValidatorType(def);

	if (isArkCompiled) {
		const result = validateArkType(def, config, env);
		if (!result.success) {
			throw new ArkEnvError(result.issues as any);
		}
		return result.value;
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

	return result.value;
}

export default createEnv;
