import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

/** Packages that must never appear in a `/standard` entry's import graph. */
export const FORBIDDEN_STANDARD_DEPS = Object.freeze([
	"arktype",
	"@arkenv/core",
]);

/**
 * Resolve published `/standard` (and nested `/standard/*`) export entry files.
 *
 * @param {string} packageDir Absolute path to the package root
 * @param {"import" | "require"} [condition="import"] Export condition to resolve
 * @returns {{ exportPath: string, filePath: string }[]}
 */
export function getStandardExportEntries(packageDir, condition = "import") {
	const packageJsonPath = join(packageDir, "package.json");
	const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
	const exportsMap = packageJson.exports;
	if (!exportsMap || typeof exportsMap !== "object") {
		return [];
	}

	/** @type {{ exportPath: string, filePath: string }[]} */
	const entries = [];

	for (const [exportPath, target] of Object.entries(exportsMap)) {
		if (exportPath !== "./standard" && !exportPath.startsWith("./standard/")) {
			continue;
		}

		const resolved = resolveExportTarget(target, condition);
		if (!resolved) {
			throw new Error(
				`Could not resolve "${condition}" target for ${packageJson.name ?? packageDir} export "${exportPath}"`,
			);
		}

		entries.push({
			exportPath,
			filePath: resolve(packageDir, resolved),
		});
	}

	return entries;
}

/**
 * Resolve a package exports target to a relative file path.
 *
 * @param {unknown} target
 * @param {"import" | "require"} condition
 * @returns {string | undefined}
 */
function resolveExportTarget(target, condition) {
	if (typeof target === "string") {
		return target;
	}
	if (!target || typeof target !== "object") {
		return undefined;
	}

	const record = /** @type {Record<string, unknown>} */ (target);
	const conditioned = record[condition] ?? record.default;
	if (typeof conditioned === "string") {
		return conditioned;
	}
	if (conditioned && typeof conditioned === "object") {
		const nested = /** @type {Record<string, unknown>} */ (conditioned);
		if (typeof nested[condition] === "string") {
			return /** @type {string} */ (nested[condition]);
		}
		if (typeof nested.default === "string") {
			return nested.default;
		}
	}
	return undefined;
}

/**
 * Ensure the package dist exists, building when needed.
 *
 * @param {string} packageDir Absolute path to the package root
 * @param {string[]} entryFiles Absolute paths that must exist
 */
export function ensurePackageDist(packageDir, entryFiles) {
	const missing = entryFiles.filter((filePath) => !existsSync(filePath));
	if (missing.length === 0) {
		return;
	}

	execSync("pnpm run build", {
		cwd: packageDir,
		stdio: "inherit",
	});

	const stillMissing = entryFiles.filter((filePath) => !existsSync(filePath));
	if (stillMissing.length > 0) {
		throw new Error(
			`Missing built standard entries after build in ${packageDir}:\n${stillMissing.join("\n")}`,
		);
	}
}

/**
 * Check whether a specifier is a forbidden Standard Mode dependency.
 *
 * @param {string} specifier
 * @returns {boolean}
 */
export function isForbiddenStandardDep(specifier) {
	return FORBIDDEN_STANDARD_DEPS.some(
		(forbidden) =>
			specifier === forbidden || specifier.startsWith(`${forbidden}/`),
	);
}

/**
 * Assert a built entry's module graph never imports `arktype` or `@arkenv/core`.
 *
 * Uses esbuild's metafile so string literals inside error messages / codegen
 * templates are not false positives.
 *
 * @param {string} entryFile Absolute path to a built JS entry
 * @param {{ packageName?: string, exportPath?: string }} [context]
 * @returns {Promise<void>}
 */
export async function assertStandardEntryIsolated(entryFile, context = {}) {
	if (!existsSync(entryFile)) {
		throw new Error(`Standard entry not found: ${entryFile}`);
	}

	const result = await esbuild.build({
		entryPoints: [entryFile],
		bundle: true,
		write: false,
		format: "esm",
		platform: "neutral",
		packages: "external",
		metafile: true,
		logLevel: "silent",
	});

	/** @type {{ importer: string, path: string, kind: string }[]} */
	const forbidden = [];

	for (const [importer, input] of Object.entries(result.metafile.inputs)) {
		for (const imp of input.imports) {
			if (isForbiddenStandardDep(imp.path)) {
				forbidden.push({
					importer,
					path: imp.path,
					kind: imp.kind,
				});
			}
		}
	}

	for (const [outputPath, output] of Object.entries(result.metafile.outputs)) {
		for (const imp of output.imports ?? []) {
			if (isForbiddenStandardDep(imp.path)) {
				forbidden.push({
					importer: `output:${outputPath}`,
					path: imp.path,
					kind: imp.kind,
				});
			}
		}
	}

	if (forbidden.length === 0) {
		return;
	}

	const label = [
		context.packageName,
		context.exportPath,
		relative(process.cwd(), entryFile),
	]
		.filter(Boolean)
		.join(" ");

	const details = forbidden
		.map((hit) => `  - ${hit.path} (${hit.kind}) imported by ${hit.importer}`)
		.join("\n");

	throw new Error(`Standard Mode isolation failed for ${label}:\n${details}`);
}

/**
 * Assert every published `/standard` export for a package stays ArkType-free.
 *
 * @param {string} packageDir Absolute path to the package root
 * @param {{ conditions?: Array<"import" | "require"> }} [options]
 * @returns {Promise<{ packageName: string, checked: string[] }>}
 */
export async function assertPackageStandardIsolation(packageDir, options = {}) {
	const conditions = options.conditions ?? ["import", "require"];
	const packageJson = JSON.parse(
		readFileSync(join(packageDir, "package.json"), "utf8"),
	);
	const packageName = packageJson.name ?? relative(process.cwd(), packageDir);

	/** @type {Map<string, { exportPath: string, filePath: string }>} */
	const uniqueEntries = new Map();

	for (const condition of conditions) {
		for (const entry of getStandardExportEntries(packageDir, condition)) {
			uniqueEntries.set(entry.filePath, entry);
		}
	}

	const entries = [...uniqueEntries.values()];
	if (entries.length === 0) {
		throw new Error(`No ./standard exports found in ${packageName}`);
	}

	ensurePackageDist(
		packageDir,
		entries.map((entry) => entry.filePath),
	);

	const checked = [];
	for (const entry of entries) {
		await assertStandardEntryIsolated(entry.filePath, {
			packageName,
			exportPath: entry.exportPath,
		});
		checked.push(
			`${entry.exportPath} -> ${relative(packageDir, entry.filePath)}`,
		);
	}

	return { packageName, checked };
}

/**
 * Assert Standard Mode isolation for multiple packages.
 *
 * @param {string[]} packageDirs Absolute package directories
 * @returns {Promise<void>}
 */
export async function assertPackagesStandardIsolation(packageDirs) {
	for (const packageDir of packageDirs) {
		const { packageName, checked } =
			await assertPackageStandardIsolation(packageDir);
		console.log(
			`✅ ${packageName}: ${checked.length} standard entries isolated`,
		);
		for (const item of checked) {
			console.log(`   - ${item}`);
		}
	}
}

/**
 * Resolve package dirs relative to a monorepo root.
 *
 * @param {string} rootDir
 * @param {string[]} relativePackageDirs
 * @returns {string[]}
 */
export function resolvePackageDirs(rootDir, relativePackageDirs) {
	return relativePackageDirs.map((dir) => resolve(rootDir, dir));
}

const currentFile = fileURLToPath(import.meta.url);
const isDirectRun =
	process.argv[1] && resolve(process.argv[1]) === resolve(currentFile);

if (isDirectRun) {
	const rootDir = resolve(dirname(currentFile), "..");
	await assertPackagesStandardIsolation(
		resolvePackageDirs(rootDir, [
			"packages/vite-plugin",
			"packages/bun-plugin",
			"packages/nextjs",
			"packages/nuxt",
		]),
	);
}
