import { getPresetKeys } from "@/features/scaffold/presets";
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
 * Append hosting-preset keys onto an existing strict field bucket set.
 *
 * @param fields Mutable field buckets from defaults or key categorisation
 * @param dialect Validator dialect
 * @param context Shared scaffold context
 */
function appendPresetStrictFields(
	fields: {
		serverFields: string[];
		clientFields: string[];
		sharedFields: string[];
		runtimeEnvFields: string[];
	},
	dialect: Dialect,
	context: ScaffoldContext,
): void {
	const presetKeys = getPresetKeys(
		context.hostPreset ?? "none",
		context.clientPrefix,
	);
	for (const key of presetKeys) {
		if (context.clientPrefix && key.startsWith(context.clientPrefix)) {
			fields.clientFields.push(
				dialect.formatStrictField(
					key,
					"client",
					context.clientPrefix,
					context.hostPreset,
				),
			);
			fields.runtimeEnvFields.push(`${key}: process.env.${key},`);
		} else {
			fields.serverFields.push(
				dialect.formatStrictField(
					key,
					"server",
					context.clientPrefix,
					context.hostPreset,
				),
			);
		}
	}
}

/**
 * Build strict-layout templates from a validator dialect and scaffold context.
 *
 * Shared assembler for all dialects - only field formatting and import/wrapper
 * differences come from the dialect. Preset keys merge with defaults rather
 * than replacing them.
 *
 * @param dialect Validator dialect
 * @param keys Environment variable keys (empty uses dialect defaults)
 * @param context Shared scaffold context
 * @returns Shared, client, and server templates
 */
export function assembleStrictFromDialect(
	dialect: Dialect,
	keys: string[],
	context: ScaffoldContext,
): StrictEnvTemplates {
	const pkgName = getFrameworkPackageName(context);
	const clientImportPath = getClientImportPath(context);
	const presetKeys = getPresetKeys(
		context.hostPreset ?? "none",
		context.clientPrefix,
	);

	const fields =
		keys.length > 0
			? categorizeEnvKeys(
					Array.from(new Set([...keys, ...presetKeys])),
					context,
					(key, role) =>
						dialect.formatStrictField(
							key,
							role,
							context.clientPrefix,
							context.hostPreset,
						),
				)
			: (() => {
					const defaults = dialect.getDefaultStrictFields(context.clientPrefix);
					appendPresetStrictFields(defaults, dialect, context);
					return defaults;
				})();

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

			server:
				context.framework === "nuxt"
					? `import arkenv from "${pkgName}/server";
${extra}
export const env = arkenv(
	${serverObject},
);`
					: `import arkenv from "${pkgName}/server";
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
