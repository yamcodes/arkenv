import fs from "node:fs";
import path from "node:path";

const CAPTURE_MARKER = ".arkenv-capture";

const SOURCE_EXTENSIONS = [
	".ts",
	".mts",
	".tsx",
	".js",
	".mjs",
	".cjs",
	".json",
];

/**
 * Rollup plugin that duplicates the user schema graph under a capture id.
 *
 * The capture copy evaluates `arkenv()` while capture mode is on. The app's
 * own import of the same file stays a separate module and keeps the thin proxy.
 */
export type SchemaCapturePlugin = {
	name: string;
	resolveId: (source: string, importer: string | undefined) => string | null;
	load: (
		this: { addWatchFile: (id: string) => void },
		id: string,
	) => string | null;
};

/**
 * Build a module id that Rollup will not dedupe with the app's schema import.
 *
 * @param filePath Absolute path of the real schema file
 * @returns Capture module id that still ends in the original extension
 */
export function toCaptureModuleId(filePath: string): string {
	const ext = path.extname(filePath);
	if (!ext) {
		return `${filePath}${CAPTURE_MARKER}`;
	}
	return `${filePath.slice(0, -ext.length)}${CAPTURE_MARKER}${ext}`;
}

/**
 * Recover the real file path from a capture module id.
 *
 * @param id Rollup module id
 * @returns Absolute file path, or `null` when `id` is not a capture module
 */
export function fromCaptureModuleId(id: string): string | null {
	const bare = stripQuery(id);
	for (const ext of SOURCE_EXTENSIONS) {
		const marker = `${CAPTURE_MARKER}${ext}`;
		if (bare.endsWith(marker)) {
			return `${bare.slice(0, -marker.length)}${ext}`;
		}
	}
	if (bare.endsWith(CAPTURE_MARKER)) {
		return bare.slice(0, -CAPTURE_MARKER.length);
	}
	return null;
}

/**
 * Create the Rollup plugin that loads the schema capture copy.
 *
 * @param options Alias map from the Nuxt/Nitro config (`~`, `@`, and similar)
 * @returns Rollup plugin
 */
export function arkenvSchemaCapturePlugin(options?: {
	aliases?: Record<string, string>;
	rootDir?: string;
}): SchemaCapturePlugin {
	const aliases = options?.aliases ?? {};
	const rootDir = options?.rootDir;

	return {
		name: "arkenv-schema-capture",
		resolveId(source, importer) {
			const cleanSource = stripQuery(source);
			const fromSource = fromCaptureModuleId(cleanSource);
			if (fromSource && isFile(fromSource)) {
				return toCaptureModuleId(fromSource);
			}

			const importerFile = importer
				? fromCaptureModuleId(stripQuery(importer))
				: null;
			if (!importerFile) {
				return null;
			}

			const resolved = resolveProjectFile(source, importerFile, aliases);
			if (!resolved || (rootDir && !isInside(resolved, rootDir))) {
				return null;
			}
			return toCaptureModuleId(resolved);
		},
		load(id) {
			const file = fromCaptureModuleId(id);
			if (!file || !isFile(file)) {
				return null;
			}
			this.addWatchFile(file);
			return fs.readFileSync(file, "utf8");
		},
	};
}

/**
 * Drop a query string from a module id.
 *
 * @param id Module id or specifier
 * @returns The id without `?query`
 */
function stripQuery(id: string): string {
	const queryIndex = id.indexOf("?");
	return queryIndex === -1 ? id : id.slice(0, queryIndex);
}

/**
 * Report whether a path is an existing file outside `node_modules`.
 *
 * @param filePath Candidate path
 * @returns `true` when the path is a project file
 */
function isFile(filePath: string): boolean {
	if (isNodeModule(filePath)) {
		return false;
	}
	return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

/**
 * Report whether a file stays inside the Nuxt project root.
 *
 * @param filePath Absolute file path
 * @param rootDir Nuxt root directory
 * @returns `true` when the file is the root or a descendant
 */
function isInside(filePath: string, rootDir: string): boolean {
	const relative = path.relative(rootDir, filePath);
	return (
		relative === "" ||
		(!relative.startsWith("..") && !path.isAbsolute(relative))
	);
}

/**
 * Report whether a path lives in `node_modules`.
 *
 * @param filePath Candidate path
 * @returns `true` when the path is inside a dependency install
 */
function isNodeModule(filePath: string): boolean {
	const normalized = filePath.replace(/\\/g, "/");
	return normalized.includes("/node_modules/");
}

/**
 * Resolve a specifier from a capture importer to a project file.
 *
 * @param source Import specifier
 * @param importerFile Real file path of the capture importer
 * @param aliases Nuxt/Nitro alias map
 * @returns Absolute project file, or `null` for packages and missing files
 */
function resolveProjectFile(
	source: string,
	importerFile: string,
	aliases: Record<string, string>,
): string | null {
	if (
		source.startsWith("\0") ||
		source.startsWith("#") ||
		source.startsWith("node:")
	) {
		return null;
	}

	const aliased = applyAlias(stripQuery(source), aliases);
	const target = aliased ?? stripQuery(source);
	if (!aliased && !target.startsWith(".") && !path.isAbsolute(target)) {
		return null;
	}

	const base = path.isAbsolute(target)
		? target
		: path.resolve(path.dirname(importerFile), target);
	return resolveExisting(base);
}

/**
 * Apply the longest matching Nuxt/Nitro alias.
 *
 * @param source Import specifier
 * @param aliases Alias map
 * @returns Rewritten path, or `null` when no alias matches
 */
function applyAlias(
	source: string,
	aliases: Record<string, string>,
): string | null {
	const entries = Object.entries(aliases)
		.filter((entry): entry is [string, string] => typeof entry[1] === "string")
		.sort((a, b) => b[0].length - a[0].length);

	for (const [find, replacement] of entries) {
		if (!find) continue;
		if (source === find) {
			return replacement;
		}
		const prefix = find.endsWith("/") ? find : `${find}/`;
		if (source.startsWith(prefix)) {
			return path.join(replacement, source.slice(prefix.length));
		}
	}

	return null;
}

/**
 * Resolve a path to a file, trying TypeScript and JavaScript extensions.
 *
 * @param base Absolute path with or without an extension
 * @returns Existing project file, or `null`
 */
function resolveExisting(base: string): string | null {
	const candidates = [base];
	if (!path.extname(base)) {
		for (const ext of SOURCE_EXTENSIONS) {
			candidates.push(`${base}${ext}`);
			candidates.push(path.join(base, `index${ext}`));
		}
	}

	for (const candidate of candidates) {
		if (isFile(candidate)) {
			return candidate;
		}
	}
	return null;
}
