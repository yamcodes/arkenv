import fs from "node:fs";
import { createRequire } from "node:module";
import type { TransformerTwoslashOptions } from "fumadocs-twoslash";
import { arktypeTwoslashVfs } from "./twoslash-vfs";

export { root, wwwRoot } from "./twoslash-vfs";

const require = createRequire(import.meta.url);

export const arkTypePackageJson = JSON.parse(
	fs.readFileSync(require.resolve("arkdark/package.json"), "utf8"),
);

export type TwoslashNode =
	| {
			type: "hover" | "tag" | "query" | "completion";
			text: string;
			docs?: string;
			line: number;
			character: number;
	  }
	| {
			type: "error";
			text: string;
			docs?: string;
			line: number;
			character: number;
			code?: number | string;
	  };

export type ArkTypeTwoslashOptions = TransformerTwoslashOptions & {
	filterNode?: (node: TwoslashNode) => boolean;
};

export const arktypeTwoslashOptions: ArkTypeTwoslashOptions = {
	explicitTrigger: true,
	langs: ["ts", "tsx", "js", "jsx"],
	twoslashOptions: arktypeTwoslashVfs,
	filterNode: (node: TwoslashNode) => {
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
						.replace(
							/{@link\s+([\s\S]*?)}/g,
							(_raw: string, content: string) => {
								const cleaned = content.replace(/\s+/g, " ").trim();
								const parts = cleaned.split(/\s*(?:\||\s)\s*/);
								const target = parts[0];
								const text = parts.slice(1).join(" ") || target;

								return target.startsWith("http")
									? `[${text}](${target})`
									: `\`${text}\``;
							},
						)
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
			case "error": {
				// Filter out module-resolution errors (TS2307)
				// that occur due to framework-specific path aliases in Twoslash's virtual VFS.
				// This allows us to display real IDE-like errors (like TS2339) in documentation
				// without cluttering them with path resolution errors.
				const errorCode = node.code;
				if (errorCode === 2307) {
					return false;
				}
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
			}
			default:
				return true;
		}
	},
};
