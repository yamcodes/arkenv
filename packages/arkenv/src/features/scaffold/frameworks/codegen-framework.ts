import path from "node:path";
import { shake } from "radashi";
import type { CodegenFrameworkConfig } from "./codegen-config";
import {
	getEnvDefaultsFromKeys,
	planSimpleSchemaFile,
	planStrictSchemaFiles,
	resolveSimpleImportPath,
	resolveStrictImportPath,
} from "./shared";
import type { FrameworkStrategy } from "./types";

/**
 * Create a Next.js or Nuxt framework strategy from shared codegen config.
 *
 * Collapses duplicated nextjs/nuxt strategy bodies: package name, client
 * prefix defaults, and Next-only `wrapNextjsConfig` bootstrap come from
 * {@link CodegenFrameworkConfig}.
 *
 * @param config Codegen framework configuration.
 * @returns Framework strategy for the registry.
 */
export function createCodegenFrameworkStrategy(
	config: CodegenFrameworkConfig,
): FrameworkStrategy {
	const { id, packageName, clientPrefix, supportsWrapNextjsConfig } = config;
	const defaultApiUrlKey = `${clientPrefix}API_URL`;

	return {
		getEnvDefaults(keys) {
			if (keys && keys.length > 0) {
				return getEnvDefaultsFromKeys(keys);
			}
			return {
				DATABASE_URL: "postgres://localhost:5432/mydb",
				[defaultApiUrlKey]: "https://api.example.com",
				NODE_ENV: "development",
			};
		},

		getDependencies() {
			return [packageName];
		},

		requiresArktypePeer() {
			return true;
		},

		bootstrap(options) {
			return shake({
				framework: id,
				...(supportsWrapNextjsConfig && {
					wrapNextjsConfig: options.wrapNextjsConfig !== false,
				}),
				disableCodegen: options.disableCodegen,
			});
		},

		getSchemaFiles(validator, options, params) {
			if (options.layout === "strict") {
				const ext = path.extname(params.targetPath);
				const baseWithoutExt = params.targetPath.slice(0, -ext.length);
				const importPath = resolveStrictImportPath(
					params,
					baseWithoutExt,
					options,
				);
				return planStrictSchemaFiles(validator, options, params, importPath);
			}

			const importPath = resolveSimpleImportPath(params, options);
			return planSimpleSchemaFile(validator, options, params, importPath);
		},

		getTypeDefinitionFiles() {
			return [];
		},
	};
}
