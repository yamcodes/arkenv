import dedent from "dedent";
import type { Dialect } from "./types";
import { tryFormatPresetFieldValue } from "./types";

export const valibotDialect: Dialect = {
	extraImport: `import * as v from "valibot";`,

	formatOptionalString() {
		return "v.optional(v.string())";
	},

	formatOptionalEnum(values) {
		return `v.optional(v.picklist([${values.map((v) => `"${v}"`).join(", ")}]))`;
	},

	formatCodegenField(key, role, clientPrefix = "", hostPreset = undefined) {
		if (role === "shared") {
			return `${key}: v.optional(v.picklist(["development", "production", "test"]), "development"),`;
		}
		const preset = tryFormatPresetFieldValue(
			valibotDialect,
			key,
			clientPrefix,
			hostPreset,
		);
		if (preset) return `${key}: ${preset},`;
		return `${key}: v.optional(v.string()),`;
	},

	defaultSimpleSchemaFields: `\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),
		PORT: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000),`,

	formatSimpleSchemaFields(keys, clientPrefix = "", hostPreset = undefined) {
		return keys
			.map((key) => {
				const preset = tryFormatPresetFieldValue(
					valibotDialect,
					key,
					clientPrefix,
					hostPreset,
				);
				return `\t\t${key}: ${preset ?? "v.optional(v.string())"},`;
			})
			.join("\n");
	},

	getDefaultCodegenFields(clientPrefix) {
		return {
			serverFields: [
				`\t\tDATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgres://localhost:5432/mydb"),`,
			],
			clientFields: [
				`\t\t${clientPrefix}API_URL: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),`,
			],
			sharedFields: [
				`\t\tNODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),`,
			],
		};
	},

	assembleVanilla(schemaFields) {
		return dedent /* ts */`
	import { arkenv } from "@arkenv/standard/valibot";
	import * as v from "valibot";

	/**
	 * Environment variable schema for server-side or runtime-only validation.
	 */
	export const env = arkenv({
	${schemaFields}
	});
`;
	},
};
