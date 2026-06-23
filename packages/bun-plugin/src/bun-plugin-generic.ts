import { join } from "node:path";
import type { BunPlugin } from "bun";
import { processEnvSchema, registerLoader } from "./utils";

export function createBunPlugin(coreArkenv: any, pluginName: string) {
	function arkenv(options: any, arkenvConfig?: any): BunPlugin {
		const envMap = processEnvSchema(options, arkenvConfig, coreArkenv);

		return {
			name: pluginName,
			setup(build) {
				registerLoader(build, envMap);
			},
		} satisfies BunPlugin;
	}

	const hybrid = arkenv as any & BunPlugin;

	Object.defineProperty(hybrid, "name", {
		value: pluginName,
		writable: false,
	});

	hybrid.setup = (build: any) => {
		const envMap = new Map<string, string>();

		build.onStart(async () => {
			const cwd = process.cwd();
			let schema: any;

			const possiblePaths = [join(cwd, "src", "env.ts"), join(cwd, "env.ts")];

			for (const p of possiblePaths) {
				if (await Bun.file(p).exists()) {
					try {
						const mod = await import(p);
						if (mod.default) {
							schema = mod.default;
							break;
						}
						if (mod.env) {
							schema = mod.env;
							break;
						}
					} catch (e) {
						console.error(`Failed to load env schema from ${p}:`, e);
					}
				}
			}

			if (!schema) {
				const pathsList = possiblePaths.map((p) => ` - ${p}`).join("\n");
				const example = `
Example \`src/env.ts\`:
\`\`\`ts
import { type } from "@arkenv/core"; // or "@arkenv/standard" / "@arkenv/core"
export default type({
  BUN_PUBLIC_API_URL: "string",
  BUN_PUBLIC_DEBUG: "boolean"
});
\`\`\`
`;
				throw new Error(
					`${pluginName}: No environment schema found.\n\nChecked paths:\n${pathsList}\n\nPlease create a schema file at one of these locations exporting your environment definition.\n${example}`,
				);
			}

			const newEnvMap = processEnvSchema(schema, undefined, coreArkenv);
			envMap.clear();
			for (const [k, v] of newEnvMap) {
				envMap.set(k, v);
			}
		});

		registerLoader(build, envMap);
	};

	return { arkenv, hybrid };
}
