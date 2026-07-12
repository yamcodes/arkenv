import type { ScaffoldContext } from "../scaffold-context";
import type { StrictEnvTemplates, ValidatorStrategy } from "./types";

/**
 * Format an array of schema field strings as a braced object literal.
 *
 * Returns `"{}"` for an empty field list. Non-empty fields are each trimmed
 * and joined with newlines at the given indentation level.
 *
 * @param fields The schema field strings to format.
 * @param indent The indentation prefix to use for inner lines.
 * @returns A formatted object literal string.
 */
export function formatSchemaObject(fields: string[], indent = "\t\t"): string {
	if (fields.length === 0) {
		return "{}";
	}
	return `{\n${indent}${fields.map((f) => f.trim()).join(`\n${indent}`)}\n${indent.slice(1)}}`;
}

type CategorizedFields = {
	serverFields: string[];
	clientFields: string[];
	sharedFields: string[];
	runtimeEnvFields: string[];
};

/**
 * Categorize env keys into server, client, shared, and runtime fields.
 *
 * @param keys Environment variable keys to categorize.
 * @param context Shared scaffold context.
 * @param formatField Validator-specific field formatter.
 * @returns Categorized schema and runtime env fields.
 */
export function categorizeEnvKeys(
	keys: string[],
	context: ScaffoldContext,
	formatField: ValidatorStrategy["formatField"],
): CategorizedFields {
	const serverFields: string[] = [];
	const clientFields: string[] = [];
	const sharedFields: string[] = [];
	const runtimeEnvFields: string[] = [];

	for (const key of keys) {
		if (key.startsWith(context.clientPrefix)) {
			clientFields.push(formatField(key, "client", context));
			runtimeEnvFields.push(`${key}: process.env.${key},`);
		} else if (key === "NODE_ENV") {
			sharedFields.push(formatField(key, "shared", context));
			runtimeEnvFields.push(`${key}: process.env.${key},`);
		} else {
			serverFields.push(formatField(key, "server", context));
		}
	}

	return { serverFields, clientFields, sharedFields, runtimeEnvFields };
}

type StrictTemplateConfig = {
	shared: string;
	clientCodegen: string;
	clientNoCodegen: string;
	server: string;
};

/**
 * Assemble strict-layout templates from pre-built file bodies.
 *
 * @param config Validator-specific template bodies for each strict file.
 * @param context Shared scaffold context.
 * @returns Shared, client, and server templates with trailing newlines.
 */
export function assembleStrictTemplates(
	config: StrictTemplateConfig,
	context: ScaffoldContext,
): StrictEnvTemplates {
	return {
		shared: `${config.shared}\n`,
		client: `${isStrictCodegenDisabled(context) ? config.clientNoCodegen : config.clientCodegen}\n`,
		server: `${config.server}\n`,
	};
}

/**
 * Resolve the framework package name used in strict-layout imports.
 *
 * @param context Shared scaffold context.
 * @returns The package import path for the active framework integration.
 */
export function getFrameworkPackageName(context: ScaffoldContext): string {
	return context.framework === "nuxt" ? "@arkenv/nuxt" : "@arkenv/nextjs";
}

/**
 * Build runtime env options for strict client templates when codegen is disabled.
 *
 * @param runtimeEnvFields Runtime env mapping field strings.
 * @param context Shared scaffold context.
 * @returns A runtimeEnv options block or an empty string for Nuxt.
 */
export function buildRuntimeEnvOptions(
	runtimeEnvFields: string[],
	context: ScaffoldContext,
): string {
	if (context.framework === "nuxt") {
		return "";
	}
	return `,\n\t\truntimeEnv: {\n\t\t\t${runtimeEnvFields.map((f) => f.trim()).join("\n\t\t\t")}\n\t\t}`;
}

/**
 * Determine whether strict-layout templates should disable codegen.
 *
 * @param context Shared scaffold context.
 * @returns True when codegen should be disabled for strict templates.
 */
export function isStrictCodegenDisabled(context: ScaffoldContext): boolean {
	return context.disableCodegen || context.framework === "nuxt";
}

/**
 * Select the client template import path based on codegen settings.
 *
 * @param context Shared scaffold context.
 * @returns The import path for the generated or integration client entry.
 */
export function getClientImportPath(context: ScaffoldContext): string {
	if (isStrictCodegenDisabled(context)) {
		return getFrameworkPackageName(context) + "/client";
	}
	return context.nextjsImportPath || "./generated/env.gen";
}
