import { extractBlock, parseBlockKeys } from "@arkenv/build";

function parseExposeKeys(optionsArg: string): string[] {
	const exposeMatch =
		optionsArg.match(/exposeToClient\s*:\s*\[([\s\S]*?)\]/) ||
		optionsArg.match(/expose\s*:\s*\[([\s\S]*?)\]/) ||
		optionsArg.match(/shared\s*:\s*\[([\s\S]*?)\]/);
	if (!exposeMatch) return [];

	const keys: string[] = [];
	for (const match of exposeMatch[1].matchAll(/['"`](.*?)['"`]/g)) {
		keys.push(match[1]);
	}
	return keys;
}

function extractCallArguments(
	content: string,
): { schemaArg: string; optionsArg: string | null } | null {
	const regex = /\b(?:arkenv|createEnv)\s*\(/g;
	while (regex.exec(content) !== null) {
		let parenCount = 1;
		let index = regex.lastIndex;
		let inString: string | null = null;
		let inComment: "single" | "multi" | null = null;
		let braceCount = 0;
		let bracketCount = 0;

		const args: string[] = [];
		let currentArg = "";

		while (index < content.length && parenCount > 0) {
			const char = content[index];
			const nextChar = content[index + 1];

			if (inComment === "single") {
				if (char === "\n" || char === "\r") inComment = null;
				currentArg += char;
				index++;
				continue;
			}
			if (inComment === "multi") {
				if (char === "*" && nextChar === "/") {
					inComment = null;
					currentArg += "*/";
					index += 2;
					continue;
				}
				currentArg += char;
				index++;
				continue;
			}

			if (inString) {
				if (char === inString && content[index - 1] !== "\\") {
					inString = null;
				}
				currentArg += char;
				index++;
				continue;
			}

			if (char === "/" && nextChar === "/") {
				inComment = "single";
				currentArg += "//";
				index += 2;
				continue;
			}
			if (char === "/" && nextChar === "*") {
				inComment = "multi";
				currentArg += "/*";
				index += 2;
				continue;
			}
			if (char === "'" || char === '"' || char === "`") {
				inString = char;
				currentArg += char;
				index++;
				continue;
			}

			if (char === "(") {
				parenCount++;
			} else if (char === ")") {
				parenCount--;
			} else if (char === "{") {
				braceCount++;
			} else if (char === "}") {
				braceCount--;
			} else if (char === "[") {
				bracketCount++;
			} else if (char === "]") {
				bracketCount--;
			}

			if (parenCount === 0) {
				args.push(currentArg);
				break;
			}

			if (
				char === "," &&
				parenCount === 1 &&
				braceCount === 0 &&
				bracketCount === 0
			) {
				args.push(currentArg);
				currentArg = "";
			} else {
				currentArg += char;
			}
			index++;
		}

		if (parenCount === 0 && args.length > 0) {
			return {
				schemaArg: args[0].trim(),
				optionsArg: args[1] ? args[1].trim() : null,
			};
		}
	}
	return null;
}

/**
 * Statically extract client and shared keys from the schema content.
 *
 * @param content The schema file string content
 * @returns An object containing the extracted client and shared keys
 */
export function extractKeys(content: string): {
	clientKeys: string[];
	sharedKeys: string[];
	isLegacy?: boolean;
} {
	const clientKeys: string[] = [];
	const sharedKeys: string[] = [];

	const args = extractCallArguments(content);
	if (!args) {
		return { clientKeys, sharedKeys, isLegacy: false };
	}

	const trimmedSchema = args.schemaArg
		.replace(/^\{/, "")
		.replace(/\}$/, "")
		.trim();
	const topKeys = parseBlockKeys(trimmedSchema);
	const isLegacy =
		topKeys.includes("client") ||
		topKeys.includes("server") ||
		topKeys.includes("shared");

	if (isLegacy) {
		const clientBlock = extractBlock(args.schemaArg, "client");
		if (clientBlock) clientKeys.push(...parseBlockKeys(clientBlock));
		const sharedBlock = extractBlock(args.schemaArg, "shared");
		if (sharedBlock) sharedKeys.push(...parseBlockKeys(sharedBlock));
		return { clientKeys, sharedKeys, isLegacy };
	}

	const optionExposedKeys = args.optionsArg
		? parseExposeKeys(args.optionsArg)
		: [];

	for (const key of topKeys) {
		if (optionExposedKeys.includes(key) || key === "NODE_ENV") {
			sharedKeys.push(key);
			continue;
		}
		if (key.startsWith("NEXT_PUBLIC_")) {
			clientKeys.push(key);
		}
	}

	return { clientKeys, sharedKeys, isLegacy };
}
