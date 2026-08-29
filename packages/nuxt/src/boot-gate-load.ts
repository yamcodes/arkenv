import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SchemaShape } from "@repo/types";
import { createJiti } from "jiti";
import {
	beginCapture,
	combineCapturedSchemas,
	endCapture,
	publicKeysFromCaptures,
} from "./capture";
import { withForceServer } from "./validate-context";

export type BootGateEngine = "arktype" | "standard";

export type BootGateConfig = {
	schemaPath: string;
	engine: BootGateEngine;
};

/**
 * Build Jiti aliases that point package entry points at this package's source/dist.
 *
 * @param packageDir Absolute directory containing this package's entry files
 * @param internalOptions Optional alias overrides for tests
 * @returns Alias map for Jiti
 */
export function buildSchemaJitiAliases(
	packageDir: string,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): Record<string, string> {
	const packageJsonPath = path.resolve(packageDir, "../package.json");
	let pkgExports: Record<string, unknown> = {};
	try {
		const pkgContent = fs.readFileSync(packageJsonPath, "utf-8");
		pkgExports = JSON.parse(pkgContent).exports || {};
	} catch {
		// fallback if package.json isn't adjacent/found
	}

	const resolveExportPath = (subpath: string, fallbackFile: string): string => {
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
				const fileBasename = path.basename(target).replace(/\.m?[jt]s$/, "");
				const tsPath = path.join(packageDir, `${fileBasename}.ts`);
				if (fs.existsSync(tsPath)) {
					return tsPath;
				}
				const jsPath = path.join(packageDir, `${fileBasename}.js`);
				if (fs.existsSync(jsPath)) {
					return jsPath;
				}
			}
		}
		return fallbackFile;
	};

	const indexPath = resolveExportPath(
		".",
		fs.existsSync(path.join(packageDir, "index.ts"))
			? path.join(packageDir, "index.ts")
			: path.join(packageDir, "index.js"),
	);
	const standardIndexPath = resolveExportPath(
		"./standard",
		fs.existsSync(path.join(packageDir, "standard/index.ts"))
			? path.join(packageDir, "standard/index.ts")
			: path.join(packageDir, "standard/index.js"),
	);

	const mockImportsPath = fs.existsSync(
		path.join(packageDir, "mock-imports.ts"),
	)
		? path.join(packageDir, "mock-imports.ts")
		: fs.existsSync(path.join(packageDir, "mock-imports.js"))
			? path.join(packageDir, "mock-imports.js")
			: path.join(packageDir, "mock-imports.cjs");

	const emptyServerBootPath = fs.existsSync(
		path.join(packageDir, "empty-server-boot.ts"),
	)
		? path.join(packageDir, "empty-server-boot.ts")
		: path.join(packageDir, "empty-server-boot.js");

	return {
		"@arkenv/nuxt": indexPath,
		"@arkenv/nuxt/standard": standardIndexPath,
		"#imports": mockImportsPath,
		"#arkenv/server-boot": emptyServerBootPath,
		...internalOptions?._jitiAliases,
	};
}

/**
 * Resolve the directory that contains this package's compiled or source entries.
 *
 * @returns Absolute package entry directory
 */
function resolvePackageDir(): string {
	const filenameForJiti =
		typeof __filename !== "undefined"
			? __filename
			: typeof import.meta !== "undefined" && import.meta.url
				? fileURLToPath(import.meta.url)
				: "";
	return path.dirname(filenameForJiti);
}

/**
 * Load user schema files under capture mode and return the combined schema.
 *
 * @param config Boot-gate schema location options
 * @param internalOptions Optional Jiti alias overrides for tests
 * @returns Combined schema and public key set
 */
export function loadSchemaViaCapture(
	config: BootGateConfig,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): { schema: SchemaShape; publicKeys: Set<string> } {
	const packageDir = resolvePackageDir();
	const fileToEvaluate = config.schemaPath;

	const aliases = buildSchemaJitiAliases(packageDir, internalOptions);

	const jitiOptions = {
		moduleCache: false,
		fsCache: false,
		tsconfigPaths: true,
		alias: aliases,
	} as const;

	return withForceServer(() => {
		beginCapture();
		try {
			const evaluateSchema = (jiti: ReturnType<typeof createJiti>) => {
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
				} else {
					throw error;
				}
			}

			const calls = endCapture();
			return {
				schema: combineCapturedSchemas(calls),
				publicKeys: publicKeysFromCaptures(calls),
			};
		} finally {
			endCapture();
		}
	});
}
