import fs from "node:fs";
import path from "node:path";
import { extractKeys, findSchemaPath } from "@arkenv/build";
import { createJiti } from "jiti";

/** Known plugin option keys used to discriminate transform-mode calls from schemas. */
const TRANSFORM_OPTION_KEYS = new Set([
	"schemaPath",
	"clientPrefix",
	"logger",
	"logLevel",
	"env",
	"coerce",
	"onUndeclaredKey",
	"arrayFormat",
	"debugSecrets",
	"emptyAsUndefined",
]);

/**
 * Options for the Vite plugin's env-module transform mode.
 *
 * @see docs/adr/0015-env-object-canonical-surface.md (on `dev`) — transform design
 */
export type ViteTransformOptions = {
	/**
	 * Path to the env module (`env.ts`), relative to the Vite project root.
	 *
	 * When omitted, ArkEnv auto-discovers `src/env.ts` or `env.ts`.
	 */
	schemaPath?: string;
	/**
	 * Prefix(es) that mark client-exposed environment variables.
	 *
	 * Defaults to Vite's `envPrefix` (typically `"VITE_"`).
	 */
	clientPrefix?: string | string[];
};

/**
 * Decide whether the first plugin argument selects transform mode.
 *
 * Transform mode: `arkenv()`, `arkenv({ schemaPath })`, or options-only bags.
 * SPA mode: `arkenv(schema)` / `arkenv(schema, config)` — including `arkenv({})`.
 *
 * @param first The first argument passed to the plugin factory
 * @param second The optional second (SPA config) argument
 * @returns Whether the call should enable env-module transform mode
 */
export function isTransformModeCall(
	first: unknown,
	second: unknown,
): first is ViteTransformOptions | undefined {
	if (second !== undefined) return false;
	if (first === undefined) return true;
	if (typeof first !== "object" || first === null) return false;
	const keys = Object.keys(first);
	if (keys.length === 0) return false;
	return keys.every((key) => TRANSFORM_OPTION_KEYS.has(key));
}

/**
 * Strip Vite virtual-module and query suffixes from a module id.
 *
 * @param id The raw Vite module id
 * @returns A filesystem path suitable for comparison
 */
export function normalizeModuleId(id: string): string {
	let normalized = id;
	if (normalized.startsWith("\0")) {
		normalized = normalized.slice(1);
	}
	const queryIndex = normalized.indexOf("?");
	if (queryIndex !== -1) {
		normalized = normalized.slice(0, queryIndex);
	}
	return path.normalize(normalized);
}

/**
 * Check whether a Vite module id refers to the resolved env module.
 *
 * @param id The Vite module id (may include query strings)
 * @param schemaPath The absolute path to the env module
 * @returns Whether `id` identifies the same module as `schemaPath`
 */
export function isEnvModuleId(id: string, schemaPath: string): boolean {
	const normalizedId = path.resolve(normalizeModuleId(id));
	const normalizedSchema = path.resolve(schemaPath);
	if (normalizedId === normalizedSchema) return true;

	const stripExt = (filePath: string) =>
		filePath.replace(/\.(m|c)?[jt]sx?$/, "");
	return stripExt(normalizedId) === stripExt(normalizedSchema);
}

/**
 * Resolve the absolute env-module path from plugin options and the Vite root.
 *
 * @param root The Vite project root
 * @param schemaPath An optional relative or absolute schema path from plugin config
 * @returns The absolute path to the env module
 * @throws If no env module can be found
 */
export function resolveEnvModulePath(
	root: string,
	schemaPath?: string,
): string {
	if (schemaPath) {
		const resolved = path.isAbsolute(schemaPath)
			? schemaPath
			: path.resolve(root, schemaPath);
		if (!fs.existsSync(resolved)) {
			throw new Error(
				`ArkEnv Vite plugin: schemaPath "${schemaPath}" does not exist (resolved to "${resolved}").`,
			);
		}
		return resolved;
	}

	const discovered = findSchemaPath(root);
	if (!discovered) {
		throw new Error(
			`ArkEnv Vite plugin: could not find an env module. Expected "src/env.ts" or "env.ts" under "${root}", or pass schemaPath.`,
		);
	}
	return discovered;
}

/**
 * Normalize a Vite `envPrefix` / `clientPrefix` value to a string array.
 *
 * @param prefix A string prefix, list of prefixes, or undefined
 * @returns A non-empty list of prefixes (defaults to `["VITE_"]`)
 */
export function normalizePrefixes(
	prefix: string | string[] | undefined,
): string[] {
	if (prefix === undefined) return ["VITE_"];
	return Array.isArray(prefix) ? prefix : [prefix];
}

/**
 * Classify schema keys into client, shared, and server-only sets.
 *
 * @param content The source of the env module
 * @param prefixes Client-exposed prefixes (e.g. `["VITE_"]`)
 * @returns Key classification for the transform
 */
export function classifyEnvKeys(
	content: string,
	prefixes: string[],
): {
	clientKeys: string[];
	sharedKeys: string[];
	serverKeys: string[];
} {
	const primary = prefixes[0] ?? "VITE_";
	const { clientKeys, sharedKeys, serverKeys } = extractKeys(content, primary);

	if (prefixes.length <= 1) {
		return { clientKeys, sharedKeys, serverKeys };
	}

	const clientSet = new Set(clientKeys);
	const remainingServer: string[] = [];
	for (const key of serverKeys) {
		if (prefixes.some((prefix) => key.startsWith(prefix))) {
			clientSet.add(key);
		} else {
			remainingServer.push(key);
		}
	}

	return {
		clientKeys: [...clientSet],
		sharedKeys,
		serverKeys: remainingServer,
	};
}

/**
 * Load the env module via Jiti with `process.env` seeded from Vite's loaded env.
 *
 * @param schemaPath Absolute path to the env module
 * @param loadedEnv Env values from Vite `loadEnv` (and optional plugin overrides)
 * @returns The validated `env` export (named or default)
 * @throws If the module cannot be loaded or does not export `env`
 */
export function loadValidatedEnv(
	schemaPath: string,
	loadedEnv: Record<string, string | undefined>,
): Record<string, unknown> {
	const previousEnv = { ...process.env };
	Object.assign(process.env, loadedEnv);

	try {
		const jitiOptions = {
			moduleCache: false,
			fsCache: false,
			tsconfigPaths: true,
		} as const;

		/**
		 * Evaluate the env module with the given Jiti instance.
		 *
		 * @param jiti The configured Jiti loader
		 * @returns The module namespace
		 */
		const evaluate = (jiti: ReturnType<typeof createJiti>) =>
			jiti(schemaPath) as {
				env?: Record<string, unknown>;
				default?: Record<string, unknown> | { env?: Record<string, unknown> };
			};

		let mod: ReturnType<typeof evaluate>;
		try {
			mod = evaluate(createJiti(schemaPath, jitiOptions));
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			const isTsconfigNotFound =
				error instanceof Error &&
				/tsconfig/i.test(message) &&
				(/not found/i.test(message) ||
					(error as NodeJS.ErrnoException).code === "ENOENT");

			if (!isTsconfigNotFound) throw error;
			mod = evaluate(
				createJiti(schemaPath, { ...jitiOptions, tsconfigPaths: false }),
			);
		}

		const exported =
			mod.env ??
			(mod.default &&
			typeof mod.default === "object" &&
			"env" in mod.default &&
			mod.default.env
				? mod.default.env
				: mod.default);

		if (!exported || typeof exported !== "object") {
			throw new Error(
				`ArkEnv Vite plugin: "${schemaPath}" must export an \`env\` object (named or default).`,
			);
		}

		return exported as Record<string, unknown>;
	} finally {
		for (const key of Object.keys(process.env)) {
			if (!(key in previousEnv)) {
				delete process.env[key];
			}
		}
		Object.assign(process.env, previousEnv);
	}
}

/**
 * Build the client-graph replacement module: inlined coerced literals + server-key guards.
 *
 * No validator import is emitted. See ADR 0015 (env-object canonical surface) —
 * contributors must not reintroduce `env.gen.ts`, client-side re-validation, or
 * `runtimeEnv` wiring on hosts that own their transform.
 *
 * @param clientValues Coerced values for client and shared keys
 * @param serverKeys Server-only keys that must throw when read on the client
 * @returns The transformed module source
 */
export function generateClientEnvModule(
	clientValues: Record<string, unknown>,
	serverKeys: string[],
): string {
	const lines: string[] = ["const env = {"];

	for (const [key, value] of Object.entries(clientValues)) {
		lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
	}

	for (const key of serverKeys) {
		const message = `ArkEnv Error: Attempted to access server environment variable '${key}' on the client.`;
		lines.push(
			`  get [${JSON.stringify(key)}]() {`,
			`    throw new Error(${JSON.stringify(message)});`,
			"  },",
		);
	}

	lines.push("};", "export { env };", "export default env;", "");
	return lines.join("\n");
}

/**
 * Check whether a changed file is a dotenv file Vite may load.
 *
 * @param file Absolute path of the changed file
 * @returns Whether the file looks like a `.env` / `.env.*` file
 */
export function isDotEnvFile(file: string): boolean {
	return /^\.env(?:\..+)?$/.test(path.basename(file));
}
