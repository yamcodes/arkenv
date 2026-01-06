import { createRequire } from "node:module";
import { coerce } from "../utils/coerce";
import type { EnvIssue, SchemaAdapter } from "./index";

const require = createRequire(import.meta.url);

export class ArkTypeAdapter implements SchemaAdapter {
	readonly kind = "arktype";

	constructor(
		private schemaDef: unknown,
		private config: {
			coerce?: boolean;
			onUndeclaredKey?: "ignore" | "delete" | "reject";
			arrayFormat?: "comma" | "json" | undefined;
		} = {},
	) {}

	validate(env: Record<string, string | undefined>) {
		try {
			const { $ } = require("@repo/scope");
			const { type } = require("arktype");

			const isCompiledType =
				typeof this.schemaDef === "function" &&
				"assert" in (this.schemaDef as any);

			let schema = isCompiledType
				? (this.schemaDef as any)
				: $.type(this.schemaDef);

			// Apply the `onUndeclaredKey` option, defaulting to "delete" for arkenv compatibility
			schema = schema.onUndeclaredKey(this.config.onUndeclaredKey ?? "delete");

			// Apply coercion transformation
			if (this.config.coerce !== false) {
				schema = coerce(type, schema, {
					arrayFormat: this.config.arrayFormat as any,
				});
			}

			const result = schema(env);

			if (result instanceof type.errors) {
				return {
					success: false,
					issues: Object.entries(result.byPath).map(([path, error]) => ({
						path: path ? path.split(".") : [],
						message: (error as any).message,
						validator: "arktype" as const,
					})),
				} as const;
			}

			return {
				success: true,
				value: result,
			} as const;
		} catch (e: any) {
			if (e.code === "MODULE_NOT_FOUND") {
				throw new Error(
					"ArkType is required for this schema type. Please install 'arktype' or use a Standard Schema validator like Zod.",
				);
			}
			throw e;
		}
	}
}
