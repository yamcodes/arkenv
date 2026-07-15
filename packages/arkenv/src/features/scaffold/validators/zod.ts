import type { ScaffoldContext } from "@/features/scaffold/scaffold-context";
import { zodTemplate } from "@/features/scaffold/templates";
import {
	assembleStrictTemplates,
	buildRuntimeEnvOptions,
	categorizeEnvKeys,
	formatSchemaObject,
	getClientImportPath,
	getFrameworkPackageName,
} from "./shared";
import type { ValidatorStrategy } from "./types";

function getDefaultStrictFields(context: ScaffoldContext) {
	const defaultClientKey = `${context.clientPrefix}API_URL`;
	return {
		serverFields: [
			`DATABASE_URL: z.string().url().default("postgres://localhost:5432/mydb"),`,
		],
		clientFields: [
			`${defaultClientKey}: z.string().url().default("https://api.example.com"),`,
		],
		sharedFields: [
			`NODE_ENV: z.enum(["development", "production", "test"]).default("development"),`,
		],
		runtimeEnvFields: [
			`${defaultClientKey}: process.env.${defaultClientKey},`,
			"NODE_ENV: process.env.NODE_ENV,",
		],
	};
}

export const zodStrategy: ValidatorStrategy = {
	formatField(key, role) {
		if (role === "shared") {
			return `${key}: z.enum(["development", "production", "test"]).default("development"),`;
		}
		if (role === "server" && key === "PORT") {
			return "PORT: z.coerce.number().int().min(1).max(65535).default(3000),";
		}
		return `${key}: z.string().optional(),`;
	},

	getSimpleTemplate(keys, context) {
		return `${zodTemplate(
			keys.length > 0 ? keys : undefined,
			context.framework,
			context.nextjsImportPath,
			context.disableCodegen,
			context.layout,
		)}\n`;
	},

	getStrictTemplates(keys, context) {
		const pkgName = getFrameworkPackageName(context);
		const clientImportPath = getClientImportPath(context);
		const runtimeEnvOptions = (runtimeEnvFields: string[]) =>
			buildRuntimeEnvOptions(runtimeEnvFields, context);

		let serverFields: string[];
		let clientFields: string[];
		let sharedFields: string[];
		let runtimeEnvFields: string[];

		if (keys.length > 0) {
			({ serverFields, clientFields, sharedFields, runtimeEnvFields } =
				categorizeEnvKeys(keys, context, this.formatField));
		} else {
			({ serverFields, clientFields, sharedFields, runtimeEnvFields } =
				getDefaultStrictFields(context));
		}

		return assembleStrictTemplates(
			{
				shared: `import { z } from "zod";

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import \`env\` from \`./client\` or \`./server\` instead.
 */
export const SharedSchema = z.object(${formatSchemaObject(sharedFields, "\t")});`,

				clientCodegen: `import arkenv from "${clientImportPath}";
import { z } from "zod";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema],
	},
);`,

				clientNoCodegen: `import arkenv from "${clientImportPath}";
import { z } from "zod";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	${formatSchemaObject(clientFields, "\t\t")},
	{
		extends: [SharedSchema]${runtimeEnvOptions(runtimeEnvFields)}
	},
);`,

				server: `import arkenv from "${pkgName}/server";
import { z } from "zod";
import { env as clientEnv } from "./client";

export const env = arkenv(
	${formatSchemaObject(serverFields, "\t\t")},
	{
		extends: [clientEnv],
	},
);`,
			},
			context,
		);
	},
};
