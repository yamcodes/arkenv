import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { EnvIssue, SchemaAdapter } from "./index";

export class StandardSchemaAdapter implements SchemaAdapter {
	readonly kind = "standard";

	constructor(private schema: StandardSchemaV1) {}

	validate(env: Record<string, string | undefined>) {
		const result = this.schema["~standard"].validate(env);

		if (result instanceof Promise) {
			throw new Error("ArkEnv does not support asynchronous validation.");
		}

		if (result.issues) {
			return {
				success: false,
				issues: result.issues.map((issue) => ({
					path: (issue.path as string[]) ?? [],
					message: issue.message,
					validator: "standard" as const,
				})),
			} as const;
		}

		return {
			success: true,
			value: result.value,
		} as const;
	}
}
