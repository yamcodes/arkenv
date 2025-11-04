import { createRequire } from "node:module";
import { rehypeCodeDefaultOptions, remarkNpm } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import {
	type TransformerTwoslashOptions,
	transformerTwoslash,
} from "fumadocs-twoslash";
import { createFileSystemTypesCache } from "fumadocs-twoslash/cache-fs";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import remarkGemoji from "remark-gemoji";

const require = createRequire(import.meta.url);

/**
 * Next.js apparently strips away the "with { type: 'json' }" option, so we need to use the `require` function to import the package.json file.
 *
 *
 * If it weren't for this issue, we'd be able to use:
 *
 * ```ts
 * import arkTypePackageJson from "arkdark/package.json" with { type: "json" };
 * ```
 */
const arkTypePackageJson = require("arkdark/package.json");

export const docs = defineDocs({
	dir: "content/docs",
	docs: {
		files: ["**/*", "!**/README.md"],
	},
});

/** biome-ignore-start lint/style/useTemplate: Copied from ArkType */
/**
 * Twoslash property prefix {@link https://github.com/arktypeio/arktype/blob/ff7db8b61004f8de82089a22f4cb4ab5938c2a97/ark/docs/lib/shiki.ts#L37 | ripped from ArkType}
 */
const twoslashPropertyPrefix = "(property) ";
/**
 * Twoslash options {@link https://github.com/arktypeio/arktype/blob/ff7db8b61004f8de82089a22f4cb4ab5938c2a97/ark/docs/lib/shiki.ts#L38 | ripped from ArkType}
 */
const arktypeTwoslashOptions = {
	explicitTrigger: false,
	langs: ["ts", "js"],
	twoslashOptions: {
		compilerOptions: {
			// avoid ... in certain longer types on hover
			noErrorTruncation: true,
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
			switch (node.type) {
				case "hover":
					if (node.text.endsWith(", {}>"))
						// omit default scope param from type display
						node.text = node.text.slice(0, -5) + ">";
					if (node.text.startsWith("type")) return true;

					// when `noErrorTruncation` is enabled, TS displays the type
					// of an anonymous cyclic type as `any` instead of using
					// `...`, so replace it to clarify the type is accurately inferred
					node.text = node.text.replaceAll(" any", " ...");
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
					if (node.text.startsWith(twoslashPropertyPrefix)) {
						const expression = node.text.slice(twoslashPropertyPrefix.length);
						if (expression.startsWith("RuntimeErrors.summary") && node.docs) {
							// this shows error summary in JSDoc
							// re-add spaces stripped out during processing
							node.docs = node.docs.replaceAll("•", "    •");
							return true;
						}
						if (expression === `platform: "android" | "ios"`) {
							// this helps demonstrate narrowing on discrimination
							return true;
						}
						return false;
					}
					return false;
				case "error":
					// adapted from my ErrorLens implementation at
					// https://github.com/usernamehw/vscode-error-lens/blob/d1786ddeedee23d70f5f75b16415a6579b554b59/src/utils/extUtils.ts#L127
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
									matchResult[Number(groupIndex)],
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
} satisfies TransformerTwoslashOptions;
/** biome-ignore-end lint/style/useTemplate: Copied from ArkType */

export default defineConfig({
	mdxOptions: {
		rehypePlugins: [rehypeGithubAlerts],
		remarkPlugins: [remarkGemoji, remarkNpm],
		rehypeCodeOptions: {
			themes: {
				// High-contrast themes for WCAG AA compliance
				light: "github-light-high-contrast",
				dark: "github-dark-high-contrast",
			},
			transformers: [
				...(rehypeCodeDefaultOptions.transformers ?? []),
				transformerTwoslash({
					...arktypeTwoslashOptions,
					typesCache: createFileSystemTypesCache(),
					explicitTrigger: true,
				}),
			],
		},
	},
});
