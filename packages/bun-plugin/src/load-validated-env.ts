import { createJiti } from "jiti";

/**
 * Load the env module via Jiti with `process.env` seeded from the build environment.
 *
 * @param schemaPath Absolute path to the env module
 * @param loadedEnv Env values from `process.env` (and optional plugin overrides)
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
				`ArkEnv Bun plugin: "${schemaPath}" must export an \`env\` object (named or default).`,
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
