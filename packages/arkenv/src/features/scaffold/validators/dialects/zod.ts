import dedent from "dedent";
import type { Dialect } from "./types";
import { tryFormatPresetFieldValue } from "./types";

export const zodDialect: Dialect = {
	extraImport: `import { z } from "zod";`,

	formatOptionalString() {
		return "z.string().optional()";
	},

	formatOptionalEnum(values) {
		return `z.enum([${values.map((v) => `"${v}"`).join(", ")}]).optional()`;
	},

	formatStrictField(key, role, clientPrefix = "") {
		if (role === "shared") {
			return `${key}: z.enum(["development", "production", "test"]).default("development"),`;
		}
		if (role === "server" && key === "PORT") {
			return "PORT: z.coerce.number().int().min(1).max(65535).default(3000),";
		}
		const preset = tryFormatPresetFieldValue(zodDialect, key, clientPrefix);
		if (preset) return `${key}: ${preset},`;
		return `${key}: z.string().optional(),`;
	},

	formatCodegenField(key, role, clientPrefix = "") {
		if (role === "shared") {
			return `${key}: z.enum(["development", "production", "test"]).default("development"),`;
		}
		const preset = tryFormatPresetFieldValue(zodDialect, key, clientPrefix);
		if (preset) return `${key}: ${preset},`;
		return `${key}: z.string().optional(),`;
	},

	defaultSimpleSchemaFields: `\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		PORT: z.coerce.number().int().min(1).max(65535).default(3000),`,

	formatSimpleSchemaFields(keys, clientPrefix = "") {
		return keys
			.map((key) => {
				const preset = tryFormatPresetFieldValue(zodDialect, key, clientPrefix);
				return `\t\t${key}: ${preset ?? "z.string().optional()"},`;
			})
			.join("\n");
	},

	getDefaultStrictFields(clientPrefix) {
		const defaultClientKey = `${clientPrefix}API_URL`;
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
	},

	getDefaultCodegenFields(clientPrefix) {
		return {
			serverFields: [
				`\t\tDATABASE_URL: z.string().url().default("postgres://localhost:5432/mydb"),`,
			],
			clientFields: [
				`\t\t${clientPrefix}API_URL: z.string().url().default("https://api.example.com"),`,
			],
			sharedFields: [
				`\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),`,
			],
		};
	},

	sharedImports: `import { z } from "zod";`,

	wrapSharedSchema(schemaObject) {
		return `z.object(${schemaObject})`;
	},

	strictExtraImports: `import { z } from "zod";\n`,

	assembleVanilla(schemaFields) {
		return dedent /* ts */`
	import arkenv from "@arkenv/standard";
	import { z } from "zod";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const env = arkenv({
	${schemaFields}
	});
`;
	},

	pluginEnvImports: `import { type } from "@arkenv/core";
import { z } from "zod";`,
};
