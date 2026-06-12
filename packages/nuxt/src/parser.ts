/**
 * Extract environment variable keys statically from the schema file content.
 *
 * @param content The string content of the schema file
 * @returns An object containing arrays of server, client, and shared keys
 */
export function extractKeys(content: string): {
	serverKeys: string[];
	clientKeys: string[];
	sharedKeys: string[];
} {
	const serverKeys: string[] = [];
	const clientKeys: string[] = [];
	const sharedKeys: string[] = [];

	const serverBlock = extractBlock(content, "server");
	if (serverBlock) {
		serverKeys.push(...parseBlockKeys(serverBlock));
	}

	const clientBlock = extractBlock(content, "client");
	if (clientBlock) {
		clientKeys.push(...parseBlockKeys(clientBlock));
	}

	const sharedBlock = extractBlock(content, "shared");
	if (sharedBlock) {
		sharedKeys.push(...parseBlockKeys(sharedBlock));
	}

	return { serverKeys, clientKeys, sharedKeys };
}

/**
 * Extract the body of a specific block (e.g. 'server', 'client', or 'shared') from the schema content.
 *
 * @param content The string content of the schema file
 * @param blockName The name of the block to extract
 * @returns The body of the block as a string, or null if not found
 */
function extractBlock(content: string, blockName: string): string | null {
	const regex = new RegExp(
		`\\b${blockName}\\s*:\\s*(?:[a-zA-Z0-9_$.]+\\s*\\(\\s*)?\\{`,
		"g",
	);
	const match = regex.exec(content);
	if (!match) return null;

	const startIndex = regex.lastIndex;
	let braceCount = 1;
	let index = startIndex;
	let inString: string | null = null;
	let inComment: "single" | "multi" | null = null;

	while (index < content.length && braceCount > 0) {
		const char = content[index];
		const nextChar = content[index + 1];

		if (inComment === "single") {
			if (char === "\n" || char === "\r") inComment = null;
			index++;
			continue;
		}
		if (inComment === "multi") {
			if (char === "*" && nextChar === "/") {
				inComment = null;
				index += 2;
				continue;
			}
			index++;
			continue;
		}

		if (inString) {
			if (char === inString && content[index - 1] !== "\\") {
				inString = null;
			}
			index++;
			continue;
		}

		if (char === "/" && nextChar === "/") {
			inComment = "single";
			index += 2;
			continue;
		}
		if (char === "/" && nextChar === "*") {
			inComment = "multi";
			index += 2;
			continue;
		}
		if (char === "'" || char === '"' || char === "`") {
			inString = char;
			index++;
			continue;
		}

		if (char === "{") {
			braceCount++;
		} else if (char === "}") {
			braceCount--;
		}
		index++;
	}

	if (braceCount === 0) {
		return content.slice(startIndex, index - 1);
	}

	return null;
}

/**
 * Parse environment variable keys from the extracted block content.
 *
 * @param blockContent The raw body string of the schema block
 * @returns An array of parsed key names
 */
function parseBlockKeys(blockContent: string): string[] {
	const keys: string[] = [];
	let inString: string | null = null;
	let inComment: "single" | "multi" | null = null;
	let currentToken = "";
	let lastStringContent = "";
	let braceDepth = 0;

	for (let i = 0; i < blockContent.length; i++) {
		const char = blockContent[i];
		const nextChar = blockContent[i + 1];

		if (inComment === "single") {
			if (char === "\n" || char === "\r") inComment = null;
			continue;
		}
		if (inComment === "multi") {
			if (char === "*" && nextChar === "/") {
				inComment = null;
				i++;
			}
			continue;
		}

		if (inString) {
			if (char === inString && blockContent[i - 1] !== "\\") {
				inString = null;
				lastStringContent = currentToken;
				currentToken = "";
			} else {
				currentToken += char;
			}
			continue;
		}

		if (char === "/" && nextChar === "/") {
			inComment = "single";
			i++;
			continue;
		}
		if (char === "/" && nextChar === "*") {
			inComment = "multi";
			i++;
			continue;
		}
		if (char === "'" || char === '"' || char === "`") {
			inString = char;
			currentToken = "";
			continue;
		}

		if (char === "{") {
			braceDepth++;
			currentToken = "";
			lastStringContent = "";
			continue;
		}
		if (char === "}") {
			braceDepth--;
			currentToken = "";
			lastStringContent = "";
			continue;
		}

		if (char === ":") {
			if (braceDepth === 0) {
				const key = currentToken.trim() || lastStringContent.trim();
				if (key) {
					keys.push(key);
				}
			}
			currentToken = "";
			lastStringContent = "";
			continue;
		}

		if (/[a-zA-Z0-9_$]/.test(char)) {
			currentToken += char;
		} else if (char === "," || char === "\n" || char === "\r") {
			currentToken = "";
			lastStringContent = "";
		}
	}

	return keys;
}

/**
 * Extract the body of the `arkenv` function call block from the schema content.
 *
 * @param content The string content of the schema file
 * @returns The body of the block as a string, or null if not found
 */
export function extractArkenvBlock(content: string): string | null {
	const regex = /\barkenv\s*\(\s*(?:[a-zA-Z0-9_$.]+\s*\(\s*)*\{/g;
	const match = regex.exec(content);
	if (!match) return null;

	const startIndex = regex.lastIndex;
	let braceCount = 1;
	let index = startIndex;
	let inString: string | null = null;
	let inComment: "single" | "multi" | null = null;

	while (index < content.length && braceCount > 0) {
		const char = content[index];
		const nextChar = content[index + 1];

		if (inComment === "single") {
			if (char === "\n" || char === "\r") inComment = null;
			index++;
			continue;
		}
		if (inComment === "multi") {
			if (char === "*" && nextChar === "/") {
				inComment = null;
				index += 2;
				continue;
			}
			index++;
			continue;
		}

		if (inString) {
			if (char === inString && content[index - 1] !== "\\") {
				inString = null;
			}
			index++;
			continue;
		}

		if (char === "/" && nextChar === "/") {
			inComment = "single";
			index += 2;
			continue;
		}
		if (char === "/" && nextChar === "*") {
			inComment = "multi";
			index += 2;
			continue;
		}
		if (char === "'" || char === '"' || char === "`") {
			inString = char;
			index++;
			continue;
		}

		if (char === "{") {
			braceCount++;
		} else if (char === "}") {
			braceCount--;
		}
		index++;
	}

	if (braceCount === 0) {
		return content.slice(startIndex, index - 1);
	}

	return null;
}

/**
 * Extract environment variable keys statically from client schema file content.
 *
 * @param content The string content of the client schema file
 * @returns An array of extracted client keys
 */
export function extractClientKeys(content: string): string[] {
	const block = extractArkenvBlock(content);
	return block ? parseBlockKeys(block) : [];
}

/**
 * Extract environment variable keys statically from server schema file content.
 *
 * @param content The string content of the server schema file
 * @returns An array of extracted server keys
 */
export function extractServerKeys(content: string): string[] {
	const block = extractArkenvBlock(content);
	return block ? parseBlockKeys(block) : [];
}

/**
 * Extract environment variable keys statically from shared schema file content.
 *
 * @param content The string content of the shared schema file
 * @returns An array of extracted shared keys
 */
export function extractSharedKeys(content: string): string[] {
	const block = extractSharedBlock(content);
	return block ? parseBlockKeys(block) : [];
}

/**
 * Extract the body of the `SharedSchema` variable assignment block from the schema content.
 *
 * @param content The string content of the schema file
 * @returns The body of the block as a string, or null if not found
 */
function extractSharedBlock(content: string): string | null {
	const regex = /\bSharedSchema\s*=\s*(?:[a-zA-Z0-9_$.]+\s*\(\s*)*\{/g;
	const match = regex.exec(content);
	if (!match) return null;

	const startIndex = regex.lastIndex;
	let braceCount = 1;
	let index = startIndex;
	let inString: string | null = null;
	let inComment: "single" | "multi" | null = null;

	while (index < content.length && braceCount > 0) {
		const char = content[index];
		const nextChar = content[index + 1];

		if (inComment === "single") {
			if (char === "\n" || char === "\r") inComment = null;
			index++;
			continue;
		}
		if (inComment === "multi") {
			if (char === "*" && nextChar === "/") {
				inComment = null;
				index += 2;
				continue;
			}
			index++;
			continue;
		}

		if (inString) {
			if (char === inString && content[index - 1] !== "\\") {
				inString = null;
			}
			index++;
			continue;
		}

		if (char === "/" && nextChar === "/") {
			inComment = "single";
			index += 2;
			continue;
		}
		if (char === "/" && nextChar === "*") {
			inComment = "multi";
			index += 2;
			continue;
		}
		if (char === "'" || char === '"' || char === "`") {
			inString = char;
			index++;
			continue;
		}

		if (char === "{") {
			braceCount++;
		} else if (char === "}") {
			braceCount--;
		}
		index++;
	}

	if (braceCount === 0) {
		return content.slice(startIndex, index - 1);
	}

	return null;
}
