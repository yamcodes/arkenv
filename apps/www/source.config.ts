import { createRequire } from "node:module";
import { rehypeCodeDefaultOptions, remarkNpm } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import {
	type TransformerTwoslashOptions,
	transformerTwoslash,
} from "fumadocs-twoslash";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import remarkGemoji from "remark-gemoji";

const require = createRequire(import.meta.url);
const arkTypePackageJson = require("arkdark/package.json");

export const docs = defineDocs({
	dir: "content/docs",
	docs: {
		files: ["**/*", "!**/README.md"],
	},
});

const arktypeTwoslashOptions: TransformerTwoslashOptions = {
	explicitTrigger: false,
	langs: ["ts", "js"],
	twoslashOptions: {
		compilerOptions: {
			noErrorTruncation: true,
			baseUrl: "../../",
			paths: {
				arkenv: ["packages/arkenv/src/index.ts"],
				"@arkenv/vite-plugin": ["packages/vite-plugin/src/index.ts"],
				"@arkenv/bun-plugin": ["packages/bun-plugin/src/index.ts"],
				"@repo/types": ["packages/internal/types/src/index.ts"],
				"@repo/scope": ["packages/internal/scope/src/index.ts"],
				"@repo/keywords": ["packages/internal/keywords/src/index.ts"],
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
}`,
		},
		filterNode: (node) => {
			if (node.type === "hover") {
				if (typeof node.text !== "string") return true;
				if (node.text.endsWith(", {}>"))
					// omit default scope param from type display
					node.text = node.text.slice(0, -5) + ">";

				if (node.text.startsWith("type")) return true;

				// when `noErrorTruncation` is enabled, TS displays the type
				// of an anonymous cyclic type as `any` instead of using
				// `...`, so replace it to clarify the type is accurately inferred
				node.text = node.text.replace(/ any/g, " ...");

				if (node.text.startsWith("const")) {
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
					const expression = node.text.slice(11); // "(property) ".length
					if (expression.startsWith("RuntimeErrors.summary") && node.docs) {
						node.docs = node.docs.replace(/•/g, "    •");
						return true;
					}
					// Only show hovers for specific variables or if they are simple enough
					// This prevents too much noise in larger schemas
					return true;
				}
				return false;
			}
			if (node.type === "error") {
				for (const transformation of arkTypePackageJson.contributes
					.configurationDefaults["errorLens.replace"]) {
					const regex = new RegExp(transformation.matcher);
					const matchResult = regex.exec(node.text);
					if (matchResult) {
						node.text = transformation.message;
						for (let i = 0; i < matchResult.length; i++) {
							node.text = node.text.replaceAll(
								new RegExp(`\\$${i}`, "gu"),
								matchResult[i],
							);
						}
						node.text = `TypeScript: ${node.text}`;
					}
				}
				return true;
			}
			return true;
		},
	},
};

export default defineConfig({
	mdxOptions: {
		rehypePlugins: [rehypeGithubAlerts],
		remarkPlugins: [remarkGemoji, remarkNpm],
		rehypeCodeOptions: {
			themes: {
				light: "github-light-high-contrast",
				dark: "github-dark-high-contrast",
			},
			transformers: [
				transformerTwoslash({
					...arktypeTwoslashOptions,
				}),
				...(rehypeCodeDefaultOptions.transformers ?? []),
			],
		},
	},
});
