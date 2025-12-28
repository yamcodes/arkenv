import fs from "node:fs";
import path from "node:path";
import { rehypeCodeDefaultOptions, remarkNpm } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import {
	type TransformerTwoslashOptions,
	transformerTwoslash,
} from "fumadocs-twoslash";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import remarkGemoji from "remark-gemoji";

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
			noErrorTruncation: true,
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

					const text = node.text.toLowerCase();
					const isWhiteListed =
						text.includes("ark") ||
						text.includes("env") ||
						text.includes("type") ||
						text.includes("distill");

					if (!isWhiteListed) return false;

					if (node.text.startsWith("const") || node.text.startsWith("import")) {
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

					if (node.text.startsWith("(property) ")) {
						// Only show properties that have informative documentation
						return !!node.docs;
					}

					return true;
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
		rehypePlugins: [rehypeGithubAlerts],
		remarkPlugins: [remarkGemoji, remarkNpm],
		rehypeCodeOptions: {
			langs: ["ts", "js", "json", "bash", "dotenv"],
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
			transformers: [
				transformerTwoslash(arktypeTwoslashOptions),
				...(rehypeCodeDefaultOptions.transformers ?? []),
			],
		},
	},
});
