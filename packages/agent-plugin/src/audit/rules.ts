export const PUBLIC_PREFIXES = [
	"NEXT_PUBLIC_",
	"NUXT_PUBLIC_",
	"VITE_",
	"BUN_PUBLIC_",
] as const;

const SECRET_NAME =
	/(SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL|API_KEY)$|^(DATABASE_URL|REDIS_URL|DIRECT_URL|SHADOW_DATABASE_URL)$/i;

const SKIP_DIR_NAMES = new Set([
	"node_modules",
	"dist",
	".git",
	"coverage",
	".next",
	".nuxt",
	".output",
	".turbo",
	".source",
	".vercel",
	".cache",
]);

const SOURCE_EXT = /\.(?:[cm]?[jt]sx?|d\.ts)$/;

/**
 * Return whether `key` uses a framework public env prefix.
 *
 * @param key Environment variable name
 * @returns True when the key is client-safe by prefix
 */
export function hasPublicPrefix(key: string): boolean {
	return PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Return whether `key` looks like a secret or server-only credential.
 *
 * @param key Environment variable name
 * @returns True when the name matches secret heuristics
 */
export function looksLikeSecret(key: string): boolean {
	return SECRET_NAME.test(key);
}

/**
 * Return whether a public-prefixed key is a misplaced secret.
 *
 * @param key Environment variable name
 * @returns True when a public prefix wraps a secret-looking name
 */
export function isPrefixViolation(key: string): boolean {
	if (!hasPublicPrefix(key)) return false;
	const stripped = PUBLIC_PREFIXES.reduce(
		(name, prefix) =>
			name.startsWith(prefix) ? name.slice(prefix.length) : name,
		key,
	);
	return looksLikeSecret(stripped) || looksLikeSecret(key);
}

/**
 * Return whether `filePath` is a canonical ArkEnv env module.
 *
 * @param filePath Absolute or repo-relative path
 * @returns True for `env.ts` and optional two-module recipe files
 */
export function isEnvModule(filePath: string): boolean {
	const normalized = filePath.replace(/\\/g, "/");
	return (
		/(?:^|\/)env\.(?:[cm]?[jt]sx?)$/.test(normalized) ||
		/(?:^|\/)env\/(?:client|server)\.(?:[cm]?[jt]sx?)$/.test(normalized)
	);
}

/**
 * Return whether a directory name should be skipped while walking a project.
 *
 * @param name Directory basename
 * @returns True when the directory is a build or vendor folder
 */
export function shouldSkipDir(name: string): boolean {
	return SKIP_DIR_NAMES.has(name);
}

/**
 * Return whether a file is a TypeScript or JavaScript source we should parse.
 *
 * @param filePath File path
 * @returns True for JS/TS sources including declaration files
 */
export function isSourceFile(filePath: string): boolean {
	return SOURCE_EXT.test(filePath.replace(/\\/g, "/"));
}

/**
 * Return whether a file is treated as a client bundle (secret-leak surface).
 *
 * @param filePath File path
 * @param source File contents
 * @returns True for `"use client"` modules and `*.client.*` files
 */
export function isClientFile(filePath: string, source: string): boolean {
	const normalized = filePath.replace(/\\/g, "/");
	if (/(?:^|\/)[^/]+\.client\.(?:[cm]?[jt]sx?)$/.test(normalized)) {
		return true;
	}
	const head = source.slice(0, 256).trimStart();
	return (
		head.startsWith('"use client"') ||
		head.startsWith("'use client'") ||
		head.startsWith("`use client`")
	);
}

/**
 * Return whether source still uses v0 ambient ProcessEnv / ImportMetaEnv
 * augmentations.
 *
 * @param source File contents
 * @returns True when a legacy ambient pattern is present
 */
export function hasLegacyAmbient(source: string): boolean {
	return (
		/ProcessEnvAugmented/.test(source) ||
		/ImportMetaEnvAugmented/.test(source) ||
		/interface\s+ProcessEnv\b/.test(source) ||
		/interface\s+ImportMetaEnv\b/.test(source)
	);
}
