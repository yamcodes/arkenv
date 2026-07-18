import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import { withForceServer } from "./validate-context";

/**
 * Evaluate the project schema under Jiti so validation runs at build/dev time.
 *
 * In strict layout this loads `server.ts` with `#arkenv/client-env` aliased to
 * the project's `client.ts`, mirroring the Nuxt module's auto-extend wiring.
 *
 * @param schemaPath Absolute path to the schema file or directory
 * @param resolvedLayout Detected or configured layout mode
 * @param baseDir Strict-layout env directory, or empty for flat layout
 * @param internalOptions Optional Jiti alias overrides for tests
 */
export function validateSchema(
	schemaPath: string,
	resolvedLayout: "simple" | "strict",
	baseDir: string,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): void {
	withForceServer(() => {
		const g = globalThis as {
			__ARKENV_STRICT_LAYOUT__?: boolean;
			__ARKENV_CLIENT_ENV__?: unknown;
		};

		try {
			const fileToEvaluate =
				resolvedLayout === "strict" && baseDir
					? path.join(baseDir, "server.ts")
					: schemaPath;

			const filenameForJiti =
				typeof __filename !== "undefined"
					? __filename
					: typeof import.meta !== "undefined" && import.meta.url
						? fileURLToPath(import.meta.url)
						: "";
			const dir = path.dirname(filenameForJiti);

			const packageJsonPath = path.resolve(dir, "../package.json");
			let pkgExports: Record<string, unknown> = {};
			try {
				const pkgContent = fs.readFileSync(packageJsonPath, "utf-8");
				pkgExports = JSON.parse(pkgContent).exports || {};
			} catch {
				// fallback if package.json isn't adjacent/found
			}

			const resolveExportPath = (
				subpath: string,
				fallbackFile: string,
			): string => {
				const entry = pkgExports[subpath] as
					| { import?: string; default?: string }
					| string
					| undefined;
				if (entry) {
					const target =
						typeof entry === "string"
							? entry
							: entry.import || entry.default || entry;
					if (typeof target === "string") {
						const fileBasename = path
							.basename(target)
							.replace(/\.m?[jt]s$/, "");
						const tsPath = path.join(dir, `${fileBasename}.ts`);
						if (fs.existsSync(tsPath)) {
							return tsPath;
						}
						const jsPath = path.join(dir, `${fileBasename}.js`);
						if (fs.existsSync(jsPath)) {
							return jsPath;
						}
					}
				}
				return fallbackFile;
			};

			const sharedPath = resolveExportPath(
				"./shared",
				fs.existsSync(path.join(dir, "shared.ts"))
					? path.join(dir, "shared.ts")
					: path.join(dir, "shared.js"),
			);
			const indexPath = resolveExportPath(
				".",
				fs.existsSync(path.join(dir, "index.ts"))
					? path.join(dir, "index.ts")
					: path.join(dir, "index.js"),
			);
			const clientPath = resolveExportPath(
				"./client",
				fs.existsSync(path.join(dir, "client.ts"))
					? path.join(dir, "client.ts")
					: path.join(dir, "client.js"),
			);
			const serverPath = resolveExportPath(
				"./server",
				fs.existsSync(path.join(dir, "server.ts"))
					? path.join(dir, "server.ts")
					: path.join(dir, "server.js"),
			);

			const mockImportsPath = fs.existsSync(path.join(dir, "mock-imports.ts"))
				? path.join(dir, "mock-imports.ts")
				: fs.existsSync(path.join(dir, "mock-imports.js"))
					? path.join(dir, "mock-imports.js")
					: path.join(dir, "mock-imports.cjs");

			const emptyClientEnvPath = fs.existsSync(
				path.join(dir, "empty-client-env.ts"),
			)
				? path.join(dir, "empty-client-env.ts")
				: path.join(dir, "empty-client-env.js");

			const strictUserClientPath =
				resolvedLayout === "strict" && baseDir
					? path.join(baseDir, "client.ts")
					: undefined;

			const aliases: Record<string, string> = {
				"@arkenv/nuxt/shared": sharedPath,
				"@arkenv/nuxt": indexPath,
				"@arkenv/nuxt/client": clientPath,
				"@arkenv/nuxt/server": serverPath,
				"#imports": mockImportsPath,
				"#arkenv/client-env":
					strictUserClientPath && fs.existsSync(strictUserClientPath)
						? strictUserClientPath
						: emptyClientEnvPath,
				...internalOptions?._jitiAliases,
			};

			const jitiOptions = {
				moduleCache: false,
				fsCache: false,
				tsconfigPaths: true,
				alias: aliases,
			} as const;

			/**
			 * Evaluate the schema file, injecting strict-layout auto-extend state for Jiti.
			 *
			 * @param jiti The configured Jiti loader instance
			 */
			const evaluateSchema = (jiti: ReturnType<typeof createJiti>) => {
				if (strictUserClientPath && fs.existsSync(strictUserClientPath)) {
					g.__ARKENV_STRICT_LAYOUT__ = true;
					const clientMod = jiti(strictUserClientPath) as {
						env?: unknown;
						default?: { env?: unknown };
					};
					g.__ARKENV_CLIENT_ENV__ =
						clientMod.env ?? clientMod.default?.env ?? clientMod;
				}
				jiti(fileToEvaluate);
			};

			try {
				const jiti = createJiti(fileToEvaluate, jitiOptions);
				evaluateSchema(jiti);
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				const isTsconfigNotFound =
					error instanceof Error &&
					/tsconfig/i.test(message) &&
					(/not found/i.test(message) ||
						(error as NodeJS.ErrnoException).code === "ENOENT");

				if (isTsconfigNotFound) {
					const fallbackJiti = createJiti(fileToEvaluate, {
						...jitiOptions,
						tsconfigPaths: false,
					});
					evaluateSchema(fallbackJiti);
					return;
				}
				throw error;
			}
		} finally {
			delete g.__ARKENV_STRICT_LAYOUT__;
			delete g.__ARKENV_CLIENT_ENV__;
		}
	});
}
