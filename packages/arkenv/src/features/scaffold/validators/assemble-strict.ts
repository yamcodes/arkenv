import type { ScaffoldContext } from "@/features/scaffold/scaffold-context";
import type { Dialect } from "./dialects";
import {
	assembleStrictTemplates,
	buildRuntimeEnvOptions,
	categorizeEnvKeys,
	formatSchemaObject,
	getClientImportPath,
	getFrameworkPackageName,
} from "./shared";
import type { StrictEnvTemplates } from "./types";

/**
 * Build strict-layout templates from a validator dialect and scaffold context.
 *
 * Shared assembler for all dialects — only field formatting and import/wrapper
 * differences come from the dialect.
 *
 * @param dialect Validator dialect.
 * @param keys Environment variable keys (empty uses dialect defaults).
 * @param context Shared scaffold context.
 * @returns Shared, client, and server templates.
 */
export function assembleStrictFromDialect(
	dialect: Dialect,
	keys: string[],
	context: ScaffoldContext,
): StrictEnvTemplates {
	const pkgName = getFrameworkPackageName(context);
	const clientImportPath = getClientImportPath(context);

	const fields =
		keys.length > 0
			? categorizeEnvKeys(keys, context, (key, role) =>
					dialect.formatStrictField(key, role),
				)
			: dialect.getDefaultStrictFields(context.clientPrefix);

	const { serverFields, clientFields, sharedFields, runtimeEnvFields } = fields;

	const runtimeEnvOptions = buildRuntimeEnvOptions(runtimeEnvFields, context);
	const sharedObject = formatSchemaObject(sharedFields, "\t");
	const clientObject = formatSchemaObject(clientFields, "\t\t");
	const serverObject = formatSchemaObject(serverFields, "\t\t");
	const extra = dialect.strictExtraImports;

	return assembleStrictTemplates(
		{
			shared: `${dialect.sharedImports}

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import \`env\` from \`./client\` or \`./server\` instead.
 */
export const SharedSchema = ${dialect.wrapSharedSchema(sharedObject)};`,

			clientCodegen: `import arkenv from "${clientImportPath}";
${extra}import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${clientObject},
	{
		extends: [SharedSchema],
	},
);`,

			clientNoCodegen: `import arkenv from "${clientImportPath}";
${extra}import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${clientObject},
	{
		extends: [SharedSchema]${runtimeEnvOptions}
	},
);`,

			server: `import arkenv from "${pkgName}/server";
${extra}import { env as clientEnv } from "./client";

export const env = arkenv(
	${serverObject},
	{
		extends: [clientEnv],
	},
);`,
		},
		context,
	);
}
