import fs from "node:fs";
import path from "node:path";
import { rehypeCodeDefaultOptions, remarkNpm } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import {
	type TransformerTwoslashOptions,
	transformerTwoslash,
} from "fumadocs-twoslash";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import remarkDirective from "remark-directive";
import remarkGemoji from "remark-gemoji";
import { rehypeOptimizeInternalLinks } from "./lib/plugins/rehype-optimize-internal-links";

export const docs = defineDocs({
	dir: "content/docs",
	docs: {
		files: ["**/*", "!**/README.md"],
	},
});

const root = path.resolve(process.cwd(), "../../");
const arkTypePackageJson = JSON.parse(
	fs.readFileSync(new URL(import.meta.resolve("arkdark/package.json")), "utf8"),
);

const arktypeTwoslashOptions: TransformerTwoslashOptions = {
	explicitTrigger: true,
	langs: ["ts", "js"],
	twoslashOptions: {
		compilerOptions: {
			baseUrl: root,
			paths: {
				arkenv: [path.join(root, "packages/arkenv/src/index.ts")],
				"@arkenv/vite-plugin": [
					path.join(root, "packages/vite-plugin/src/index.ts"),
				],
				"@arkenv/bun-plugin": [
					path.join(root, "packages/bun-plugin/src/index.ts"),
				],
				"@repo/types": [
					path.join(root, "packages/internal/types/src/index.ts"),
				],
				"@repo/scope": [
					path.join(root, "packages/internal/scope/src/index.ts"),
				],
				"@repo/keywords": [
					path.join(root, "packages/internal/keywords/src/index.ts"),
				],
			},
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

		/** @ts-ignore cast variance */
		export interface Any<out t = any, $ = any> extends a.BaseType<t, $> {}
	}

	type type<t = unknown, $ = {}> = a.Type<t, $>
	const scope: typeof a.scope
	const match: typeof a.match

	type Prettify<t> = t extends infer o ? { [K in keyof o]: o[K] } & {} : never
}`,
		},
		filterNode: (node) => {
			switch (node.type) {
				case "hover": {
					if (typeof node.text !== "string") return true;

					if (node.text.endsWith(", {}>"))
						// omit default scope param from type display
						node.text = `${node.text.slice(0, -5)}>`;

					if (
						node.text.startsWith("const") ||
						node.text.startsWith("import") ||
						node.text.startsWith("let")
					) {
						// show type with completions populated for known examples
						node.text = node.text.replace(
							"version?: undefined",
							"version?: number | string",
						);
						node.text = node.text.replace(
							"versions?: undefined",
							"versions?: (number | string)[]",
						);

						// filter out the type of Type's invocation
						// as opposed to the Type itself
						return !node.text.includes("(data: unknown)");
					}

					const text = node.text.toLowerCase();
					const isWhiteListed =
						text.includes("ark") ||
						text.includes("env") ||
						text.includes("type") ||
						text.includes("distill");

					if (node.text.startsWith("(property) ")) {
						// ErrorLens summary formatting from main
						if (node.text.includes("RuntimeErrors.summary") && node.docs) {
							node.docs = node.docs.replaceAll("•", "    •");
							return true;
						}

						// Key narrowing demonstration from main
						if (
							node.text.includes('platform: "android" | "ios"') ||
							node.text.includes('platform: "android"') ||
							node.text.includes('platform: "ios"')
						) {
							return true;
						}

						const isAllCaps = /^\(property\) [A-Z0-9_]+:/.test(node.text);
						const isNoise = [
							"log",
							"warn",
							"error",
							"info",
							"dir",
							"group",
							"Console",
						].some((n) => text.includes(n.toLowerCase()));

						if (isNoise) return false;
						// Hide CAPS keys (likely schema definitions) unless they have documentation
						if (isAllCaps) return !!node.docs;

						// Show lowercase results (host, nodeEnv, debugging, etc.)
						return true;
					}

					return isWhiteListed;
				}
				case "error":
					for (const transformation of arkTypePackageJson.contributes
						.configurationDefaults["errorLens.replace"]) {
						const regex = new RegExp(transformation.matcher);
						const matchResult = regex.exec(node.text);
						if (matchResult) {
							node.text = transformation.message;
							// Replace groups like $0 and $1 with groups from the match
							for (
								let groupIndex = 0;
								groupIndex < matchResult.length;
								groupIndex++
							) {
								if (matchResult[groupIndex] === undefined) continue;
								node.text = node.text.replaceAll(
									new RegExp(`\\$${groupIndex}`, "gu"),
									matchResult[groupIndex],
								);
							}
							node.text = `TypeScript: ${node.text}`;
						}
					}
					return true;
				default:
					return true;
			}
		},
	},
};

export default defineConfig({
	mdxOptions: {
		rehypePlugins: [rehypeGithubAlerts, rehypeOptimizeInternalLinks],
		remarkPlugins: [remarkGemoji, remarkNpm, remarkDirective],
		rehypeCodeOptions: {
			// ...

			langs: ["ts", "js", "json", "bash", "dotenv"],
			themes: {
				light: "github-light-high-contrast",
				dark: "github-dark-high-contrast",
			},
			transformers: [
				transformerTwoslash(arktypeTwoslashOptions),
				...(rehypeCodeDefaultOptions.transformers ?? []),
			],
		},
	},
});
