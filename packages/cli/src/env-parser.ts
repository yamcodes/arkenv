import fs from "node:fs/promises";
import path from "node:path";

/**
 * Extracts environment variable keys from a .env.example file.
 * It uses a regex to find keys, ignoring comments and values.
 */
export function parseEnvExample(content: string): string[] {
	const keys: string[] = [];
	const lines = content.split(/\r?\n/);

	for (const line of lines) {
		const trimmed = line.trim();
		// Skip empty lines or comments
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}

		// Regex to match environment variable keys (e.g., KEY=VALUE or KEY=)
		// Matches standard env var naming: starts with letter/underscore, followed by letters/numbers/underscores.
		const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=/i);
		if (match?.[1]) {
			keys.push(match[1]);
		}
	}

	return Array.from(new Set(keys)); // Ensure unique keys
}

/**
 * Attempts to read .env.example from the current working directory and extract its keys.
 * Returns null if the file doesn't exist or no keys are found.
 */
export async function getEnvExampleKeys(): Promise<string[] | null> {
	const filePath = path.join(process.cwd(), ".env.example");
	try {
		const content = await fs.readFile(filePath, "utf-8");
		const keys = parseEnvExample(content);
		return keys.length > 0 ? keys : null;
	} catch {
		return null;
	}
}
