import { $ } from "@repo/scope";
import type { StandardSchemaV1 } from "@repo/types";
import type { Type } from "arktype";
import { ArkEnvError, type EnvIssue } from "./errors";
import { coerce } from "./utils/coerce";

/**
 * The configuration for the ArkEnv library.
 */
export interface ArkEnvConfig {
	env?: Record<string, string | undefined>;
	coerce?:
		| boolean
		| {
				numbers?: boolean;
				booleans?: boolean;
				objects?: boolean;
		  };
}

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

function isArktype(def: unknown): boolean {
	if (typeof def !== "function" && (typeof def !== "object" || def === null)) {
		return false;
	}

	// ArkType 2.0 markers or our own lazy proxy
	if ((def as any).isArktype === true) return true;

	const arkKind = (def as any).arkKind;

	// Narrow detection: focus on ArkType-specific metadata
	return (
		arkKind === "type" ||
		arkKind === "generic" ||
		arkKind === "module" ||
		(typeof (def as any).assert === "function" &&
			(def as any).infer !== undefined)
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

	const coercionConfig =
		config.coerce === false
			? { numbers: false, booleans: false, objects: false }
			: {
					numbers:
						typeof config.coerce === "object"
							? (config.coerce.numbers ?? true)
							: true,
					booleans:
						typeof config.coerce === "object"
							? (config.coerce.booleans ?? true)
							: true,
					objects:
						typeof config.coerce === "object"
							? (config.coerce.objects ?? true)
							: true,
				};

	const coercedEnv = coerce(schema, env, coercionConfig);

	const result = schema(coercedEnv);

	if (isArkErrors(result)) {
		const issues: EnvIssue[] = (result as any).map((error: any) => {
			return {
				path: Array.isArray(error.path)
					? error.path
					: [String(error.path || "root")],
				message: error.message,
			};
		});

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
		} else if ((validator as StandardSchemaV1)?.["~standard"]) {
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

	if (isArktype(def)) {
		const result = validateArkType(def, config, env);
		if (!result.success) {
			throw new ArkEnvError(result.issues);
		}
		return result.value;
	}

	const mappingType = detectMappingType(def as SchemaShape);

	const result =
		mappingType.type === "standard-schema"
			? validateStandardSchemaMapping(def as SchemaShape, env)
			: validateArkType(def, config, env);

	if (!result.success) {
		throw new ArkEnvError(result.issues);
	}

	return result.value;
}

export default createEnv;
