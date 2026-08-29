import dedent from "dedent";
import type { Dialect } from "./types";
import { tryFormatPresetFieldValue } from "./types";

export const zodDialect: Dialect = {
	extraImport: `import * as z from "zod";`,

	formatOptionalString() {
		return "z.string().optional()";
	},

	formatOptionalEnum(values) {
		return `z.enum([${values.map((v) => `"${v}"`).join(", ")}]).optional()`;
	},

	formatCodegenField(key, role, clientPrefix = "", hostPreset = undefined) {
		if (role === "shared") {
			return `${key}: z.enum(["development", "production", "test"]).default("development"),`;
		}
		const preset = tryFormatPresetFieldValue(
			zodDialect,
			key,
			clientPrefix,
			hostPreset,
		);
		if (preset) return `${key}: ${preset},`;
		return `${key}: z.string().optional(),`;
	},

	defaultSimpleSchemaFields: `\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		PORT: z.int().min(1).max(65535).default(3000),`,

	formatSimpleSchemaFields(keys, clientPrefix = "", hostPreset = undefined) {
		return keys
			.map((key) => {
				const preset = tryFormatPresetFieldValue(
					zodDialect,
					key,
					clientPrefix,
					hostPreset,
				);
				return `\t\t${key}: ${preset ?? "z.string().optional()"},`;
			})
			.join("\n");
	},

	getDefaultCodegenFields(clientPrefix) {
		return {
			serverFields: [
				`\t\tDATABASE_URL: z.url().default("postgres://localhost:5432/mydb"),`,
			],
			clientFields: [
				`\t\t${clientPrefix}API_URL: z.url().default("https://api.example.com"),`,
			],
			sharedFields: [
				`\t\tNODE_ENV: z.enum(["development", "production", "test"]).default("development"),`,
			],
		};
	},

	assembleVanilla(schemaFields) {
		return dedent /* ts */`
	import arkenv from "@arkenv/standard";
	import * as z from "zod";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const env = arkenv({
	${schemaFields}
	});
`;
	},
};
