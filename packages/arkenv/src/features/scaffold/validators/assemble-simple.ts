import { getCodegenConfig } from "@/features/scaffold/frameworks/codegen-config";
import {
	assembleCodegenTemplate,
	assemblePluginEnvTemplate,
} from "@/features/scaffold/frameworks/layouts";
import { getPresetKeys } from "@/features/scaffold/presets";
import type { ScaffoldContext } from "@/features/scaffold/scaffold-context";
import type { Dialect } from "./dialects";

/**
 * Assemble a single-file env schema template for the active framework.
 *
 * Frameworks/layout assemblers own structure; the dialect supplies field lines
 * and imports only. Hosting-preset keys are merged in without replacing
 * framework defaults when no explicit env keys were provided.
 *
 * @param dialect Validator dialect
 * @param keys Environment variable keys (empty uses dialect defaults)
 * @param context Shared scaffold context
 * @returns Template source with trailing newline
 */
export function assembleSimpleFromDialect(
	dialect: Dialect,
	keys: string[],
	context: ScaffoldContext,
): string {
	const presetKeys = getPresetKeys(
		context.hostPreset ?? "none",
		context.clientPrefix,
	);

	const codegenConfig = getCodegenConfig(context.framework);
	if (codegenConfig) {
		const combinedKeys =
			keys.length > 0
				? Array.from(new Set([...keys, ...presetKeys]))
				: undefined;
		return `${assembleCodegenTemplate({
			...(combinedKeys !== undefined ? { envKeys: combinedKeys } : {}),
			dialect,
			config: codegenConfig,
			...(context.nextjsImportPath !== undefined && {
				importPath: context.nextjsImportPath,
			}),
			disableCodegen: context.disableCodegen,
			...(context.layout !== undefined && { layout: context.layout }),
			...(context.hostPreset !== undefined && {
				hostPreset: context.hostPreset,
			}),
		})}\n`;
	}

	let schemaFields: string;
	if (keys.length > 0) {
		const combined = Array.from(new Set([...keys, ...presetKeys]));
		schemaFields = dialect.formatSimpleSchemaFields(
			combined,
			context.clientPrefix,
			context.hostPreset,
		);
	} else if (presetKeys.length > 0) {
		schemaFields = `${dialect.defaultSimpleSchemaFields}\n${dialect.formatSimpleSchemaFields(presetKeys, context.clientPrefix, context.hostPreset)}`;
	} else {
		schemaFields = dialect.defaultSimpleSchemaFields;
	}

	if (context.framework === "vite" || context.framework === "bun-fullstack") {
		return `${assemblePluginEnvTemplate(dialect, context.framework, schemaFields)}\n`;
	}

	return `${dialect.assembleVanilla(schemaFields)}\n`;
}
