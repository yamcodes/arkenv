export function isExternalUrl(url: string | undefined): boolean {
	if (!url) return false;

	// Internal relative paths
	if (url.startsWith("/") || url.startsWith("#")) return false;

	try {
		const urlObj = new URL(url, "http://localhost");
		const hostname = urlObj.hostname.toLowerCase();

		if (hostname === "localhost" || hostname === "127.0.0.1") {
			return false;
		}

		return urlObj.protocol === "http:" || urlObj.protocol === "https:";
	} catch {
		return false;
	}
}
