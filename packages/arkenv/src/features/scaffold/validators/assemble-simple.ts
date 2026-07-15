import { getCodegenConfig } from "@/features/scaffold/frameworks/codegen-config";
import {
	assembleCodegenTemplate,
	assemblePluginEnvTemplate,
} from "@/features/scaffold/frameworks/layouts";
import type { ScaffoldContext } from "@/features/scaffold/scaffold-context";
import type { Dialect } from "./dialects";

/**
 * Assemble a single-file env schema template for the active framework.
 *
 * Frameworks/layout assemblers own structure; the dialect supplies field lines
 * and imports only.
 *
 * @param dialect Validator dialect.
 * @param keys Environment variable keys (empty uses dialect defaults).
 * @param context Shared scaffold context.
 * @returns Template source with trailing newline.
 */
export function assembleSimpleFromDialect(
	dialect: Dialect,
	keys: string[],
	context: ScaffoldContext,
): string {
	const schemaFields =
		keys.length > 0
			? dialect.formatSimpleSchemaFields(keys)
			: dialect.defaultSimpleSchemaFields;

	if (context.framework === "vite" || context.framework === "bun-fullstack") {
		return `${assemblePluginEnvTemplate(dialect, context.framework, schemaFields)}\n`;
	}

	const codegenConfig = getCodegenConfig(context.framework);
	if (codegenConfig) {
		return `${assembleCodegenTemplate({
			...(keys.length > 0 ? { envKeys: keys } : {}),
			dialect,
			config: codegenConfig,
			...(context.nextjsImportPath !== undefined && {
				importPath: context.nextjsImportPath,
			}),
			disableCodegen: context.disableCodegen,
			...(context.layout !== undefined && { layout: context.layout }),
		})}\n`;
	}

	return `${dialect.assembleVanilla(schemaFields)}\n`;
}
