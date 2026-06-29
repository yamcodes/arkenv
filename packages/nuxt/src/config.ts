import { extractKeys as coreExtractKeys } from "@arkenv/build";

export type { LayoutMode, Logger, ResolvedLayout } from "@arkenv/build";
export {
	extractArkenvBlock,
	extractClientKeys,
	extractServerKeys,
	extractSharedKeys,
	findSchemaPath,
	resolveLayout,
} from "@arkenv/build";

/**
 * Extract keys from the schema content using the NUXT_PUBLIC_ prefix.
 *
 * @param content The schema file string content
 * @returns An object containing arrays of server, client, and shared keys
 */
export function extractKeys(content: string): {
	serverKeys: string[];
	clientKeys: string[];
	sharedKeys: string[];
	isLegacy?: boolean;
} {
	return coreExtractKeys(content, "NUXT_PUBLIC_");
}
