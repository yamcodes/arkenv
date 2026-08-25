/**
 * Canonical verbs in docs install tabs:
 * npm install / pnpm add / yarn add / bun install (not npm i, not bun add).
 */
export function normalizePackageManagerCommand(value: string): string {
	return value
		.replaceAll(/(^|\n)npm i(?=\s|$)/g, "$1npm install")
		.replaceAll(/(^|\n)bun x /g, "$1bunx ")
		.replaceAll(/(^|\n)bun add(?=\s|$)/g, "$1bun install");
}
