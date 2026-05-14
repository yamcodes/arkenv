import path from "node:path";
import dedent from "dedent";
import { Workspace } from "./workspace";

export async function bootstrapViteConfig(
	configPath: string,
	envImportPath?: string,
): Promise<{ success: boolean; updated?: boolean; error?: string }> {
	const workspace = new Workspace();
	return workspace.ensureVitePlugin("arkenvVitePlugin", {
		importFrom: "@arkenv/vite-plugin",
		envImportPath,
		verify: (code) =>
			code.includes("arkenvVitePlugin") || code.includes("arkenvPlugin"),
	});
}

export async function bootstrapBunConfig(_configPath?: string | null): Promise<{
	success: boolean;
	error?: string;
	instructions?: string;
}> {
	if (_configPath?.endsWith("bunfig.toml")) {
		return {
			success: true,
			instructions: dedent`
				[preload]
				preload = ["./bun.setup.ts"]
			`,
		};
	}

	if (
		_configPath?.endsWith("bun.setup.ts") ||
		_configPath?.endsWith("bun.setup.js")
	) {
		return {
			success: true,
			instructions: dedent`
				import arkenv from "@arkenv/bun-plugin";

				Bun.build({
				  // ... other config
				  plugins: [arkenv],
				});
			`,
		};
	}

	const instructions = dedent`
		To complete Bun integration, add the following to your setup/preload file:
		
		import arkenv from "@arkenv/bun-plugin";
		
		Bun.build({
		  // ... other config
		  plugins: [arkenv],
		});
		
		If you don't have a setup file, create one (e.g., bun.setup.ts) and add it to your bunfig.toml:
		
		[preload]
		preload = ["./bun.setup.ts"]
	`;

	return { success: true, instructions };
}

export async function findViteConfig(): Promise<string | null> {
	const workspace = new Workspace();
	return workspace.findViteConfig();
}

export async function findBunConfig(): Promise<string | null> {
	const workspace = new Workspace();
	const filenames = ["bunfig.toml", "bun.setup.ts", "bun.setup.js"];
	for (const file of filenames) {
		if (await workspace.exists(file)) return workspace.resolve(file);
	}
	return null;
}
