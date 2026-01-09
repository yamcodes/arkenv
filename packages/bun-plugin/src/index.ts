import type { EnvSchemaWithType, SchemaShape } from "@repo/types";
import { arkenv as validateEnv, type EnvSchema } from "arkenv";

/**
 * Bun plugin to validate environment variables using ArkEnv.
 */
export default function arkenv(options: EnvSchemaWithType): any;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T>,
): any;
export default function arkenv<const T extends SchemaShape>(
	options: EnvSchema<T> | EnvSchemaWithType,
): any {
	return {
		name: "@arkenv/bun-plugin",
		setup() {
			validateEnv(options as any);
		},
	};
}
