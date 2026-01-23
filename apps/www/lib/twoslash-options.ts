import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { TransformerTwoslashOptions } from "fumadocs-twoslash";

const require = createRequire(import.meta.url);

export const root = path.resolve(process.cwd(), "../../");

export const arkTypePackageJson = JSON.parse(
	fs.readFileSync(require.resolve("arkdark/package.json"), "utf8"),
);

export const arktypeTwoslashOptions: TransformerTwoslashOptions = {
	explicitTrigger: true,
	langs: ["ts", "js"],
	twoslashOptions: {
		compilerOptions: {
			baseUrl: root,
			paths: {
				arkenv: [path.join(root, "packages/arkenv/src/index.ts")],
				"arkenv/arktype": [
					path.join(root, "packages/arkenv/src/arktype/index.ts"),
				],
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
	},
	filterNode: (node: any) => {
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

				if (node.docs) {
					node.docs = node.docs
						.replace(/{@link\s+([\s\S]*?)}/g, (raw, content: string) => {
							const cleaned = content.replace(/\s+/g, " ").trim();
							const parts = cleaned.split(/\s*(?:\||\s)\s*/);
							const target = parts[0];
							const text = parts.slice(1).join(" ") || target;

							return target.startsWith("http")
								? `[${text}](${target})`
								: `\`${text}\``;
						})
						.replace(/(?<!\n)\n(?!\n)/g, " ")
						.replace(/\n{2,}/g, "\n\n")
						.trim();
				}

				const text = node.text.toLowerCase();
				const isWhiteListed =
					text.includes("ark") ||
					text.includes("env") ||
					text.includes("type") ||
					text.includes("distill") ||
					text.includes("valibot") ||
					text.includes("zod");

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
					if (isAllCaps) return !!node.docs || isWhiteListed;

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
};
