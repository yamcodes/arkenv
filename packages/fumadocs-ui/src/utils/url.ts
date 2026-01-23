export type ArkenvUrl = string;

export function isExternalUrl(url: string | undefined): boolean {
	if (!url) return false;

	// Internal relative paths
	if (url.startsWith("/") || url.startsWith("#")) return false;

	try {
		const urlObj = new URL(url, "http://localhost");
		const hostname = urlObj.hostname.toLowerCase();

		// Explicitly internal domains for Arkenv
		if (
			hostname === "arkenv.js.org" ||
			hostname === "www.arkenv.js.org" ||
			hostname === "localhost" ||
			hostname === "127.0.0.1"
		) {
			return false;
		}

		return urlObj.protocol === "http:" || urlObj.protocol === "https:";
	} catch {
		return false;
	}
}

export function optimizeInternalLink(url: string): string;
export function optimizeInternalLink(url: undefined): undefined;
export function optimizeInternalLink(
	url: string | undefined,
): string | undefined;
export function optimizeInternalLink(
	url: string | undefined,
): string | undefined {
	if (!url) return url;

	try {
		const urlObj = new URL(url, "http://localhost");
		const hostname = urlObj.hostname.toLowerCase();

		if (hostname === "arkenv.js.org" || hostname === "www.arkenv.js.org") {
			return urlObj.pathname + urlObj.search + urlObj.hash;
		}

		return url;
	} catch {
		return url;
	}
}
