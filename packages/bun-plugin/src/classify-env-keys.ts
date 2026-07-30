import { extractKeys } from "@arkenv/build";

/**
 * Classify schema keys into client, shared, and server-only sets.
 *
 * @param content The source of the env module
 * @param prefixes Client-exposed prefixes (e.g. `["BUN_PUBLIC_"]`)
 * @returns Key classification for the transform
 */
export function classifyEnvKeys(
	content: string,
	prefixes: string[],
): {
	clientKeys: string[];
	sharedKeys: string[];
	serverKeys: string[];
} {
	const primary = prefixes[0] ?? "BUN_PUBLIC_";
	const { clientKeys, sharedKeys, serverKeys } = extractKeys(content, primary);

	if (prefixes.length <= 1) {
		return { clientKeys, sharedKeys, serverKeys };
	}

	const clientSet = new Set(clientKeys);
	const remainingServer: string[] = [];
	for (const key of serverKeys) {
		if (prefixes.some((prefix) => key.startsWith(prefix))) {
			clientSet.add(key);
		} else {
			remainingServer.push(key);
		}
	}

	return {
		clientKeys: [...clientSet] as string[],
		sharedKeys,
		serverKeys: remainingServer,
	};
}
