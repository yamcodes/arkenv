import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
const zodDir = path.dirname(require.resolve("zod"));
const zodDts = path.join(zodDir, "index.d.ts");

const valibotDir = path.dirname(require.resolve("valibot"));
const valibotDts = path.join(valibotDir, "index.d.mts");

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(currentDir, "../../..");
export const wwwRoot = path.join(root, "apps/www");

/** Compiler VFS for Twoslash — no arkdark, safe to import from RSC. */
export const arktypeTwoslashVfs = {
	customTags: ["annotate", "log", "warn", "error"],
	vfsRoot: wwwRoot,
	compilerOptions: {
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		target: ts.ScriptTarget.ES2022,
		baseUrl: wwwRoot,
		paths: {
			"@arkenv/core": [path.join(root, "packages/core/src/index.ts")],
			"@arkenv/standard": [path.join(root, "packages/standard/src/index.ts")],
			"@arkenv/nextjs": [path.join(root, "packages/nextjs/src/index.ts")],
			"@arkenv/nextjs/server": [
				path.join(root, "packages/nextjs/src/server.ts"),
			],
			"@arkenv/nextjs/client": [
				path.join(root, "packages/nextjs/src/client.ts"),
			],
			"@arkenv/nextjs/config": [
				path.join(root, "packages/nextjs/src/config/index.ts"),
			],
			"@arkenv/nextjs/standard": [
				path.join(root, "packages/nextjs/src/standard/index.ts"),
			],
			"@arkenv/nextjs/standard/server": [
				path.join(root, "packages/nextjs/src/standard/server.ts"),
			],
			"@arkenv/nextjs/standard/client": [
				path.join(root, "packages/nextjs/src/standard/client.ts"),
			],
			"@arkenv/nextjs/standard/shared": [
				path.join(root, "packages/nextjs/src/standard/shared.ts"),
			],
			"@arkenv/nextjs/standard/config": [
				path.join(root, "packages/nextjs/src/standard/config.ts"),
			],
			"@/generated/env.gen": [path.join(root, "packages/nextjs/src/index.ts")],
			"@arkenv/vite-plugin": [
				path.join(root, "packages/vite-plugin/src/index.ts"),
			],
			"@arkenv/vite-plugin/standard": [
				path.join(root, "packages/vite-plugin/src/standard.ts"),
			],
			"@arkenv/bun-plugin": [
				path.join(root, "packages/bun-plugin/src/index.ts"),
			],
			"@arkenv/bun-plugin/standard": [
				path.join(root, "packages/bun-plugin/src/standard.ts"),
			],
			"@arkenv/nuxt": [path.join(root, "packages/nuxt/src/index.ts")],
			"@arkenv/nuxt/server": [path.join(root, "packages/nuxt/src/server.ts")],
			"@arkenv/nuxt/client": [path.join(root, "packages/nuxt/src/client.ts")],
			"@arkenv/nuxt/standard": [
				path.join(root, "packages/nuxt/src/standard/index.ts"),
			],
			"@arkenv/nuxt/standard/server": [
				path.join(root, "packages/nuxt/src/standard/server.ts"),
			],
			"@arkenv/nuxt/standard/client": [
				path.join(root, "packages/nuxt/src/standard/client.ts"),
			],
			"@arkenv/nuxt/standard/shared": [
				path.join(root, "packages/nuxt/src/standard/shared.ts"),
			],
			"@arkenv/nuxt/standard/module": [
				path.join(root, "packages/nuxt/src/standard/module.ts"),
			],
			"@arkenv/nuxt/standard/config": [
				path.join(root, "packages/nuxt/src/standard/config.ts"),
			],
			"@repo/types": [path.join(root, "packages/internal/types/src/index.ts")],
			"@repo/utils": [path.join(root, "packages/internal/utils/src/index.ts")],
			"@repo/log": [path.join(root, "packages/internal/log/src/index.ts")],
			"@repo/scope": [path.join(root, "packages/internal/scope/src/index.ts")],
			"@repo/keywords": [
				path.join(root, "packages/internal/keywords/src/index.ts"),
			],
			"@/*": [path.join(root, "packages/arkenv/src/*"), "./*"],
			"@/env/client": ["env/client.ts"],
			"@/env/server": ["env/server.ts"],
			"~~/env/client": ["env/client.ts"],
			"~~/env/server": ["env/server.ts"],
			zod: [zodDts, path.join(zodDir, "index.d.cts")],
			valibot: [valibotDts, path.join(valibotDir, "index.d.cts")],
		},
		types: ["node"],
	},
	extraFiles: {
		"global.d.ts": `import type * as a from "arktype"

declare global {
	const type: typeof a.type
	namespace type {
		export type cast<t> = {
			[a.inferred]?: t
		}

		export type errors = a.ArkErrors

		export type validate<def, $ = {}, args = a.bindThis<def>> = a.validateDefinition<
			def,
			$,
			args
		>
	
		export type instantiate<def, $ = {}, args = a.bindThis<def>> = type<
			a.inferDefinition<def, $, args>,
			$
		>
	
		export type infer<def, $ = {}, args = a.bindThis<def>> = a.inferDefinition<
			def,
			$,
			args
		>

		/**
		 * @ts-ignore cast variance
		 */
		export interface Any<out t = any, $ = any> extends a.BaseType<t, $> {}
	}

	type type<t = unknown, $ = {}> = a.Type<t, $>
	const scope: typeof a.scope
	const match: typeof a.match

	type Prettify<t> = t extends infer o ? { [K in keyof o]: o[K] } & {} : never
}`,
	},
};
