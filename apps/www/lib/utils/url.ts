/**
 * List of domains that should be treated as internal (same site)
 */
export const INTERNAL_DOMAINS = [
	"arkenv.js.org",
	"www.arkenv.js.org",
	"localhost",
	"127.0.0.1",
];

/**
 * Checks if a URL is external (not same domain or not a relative path)
 * This utility is safe to call from both Client and Server components.
 */
export function isExternalUrl(href: string | undefined): boolean {
	if (!href) return false;

	// Internal relative paths
	if (href.startsWith("/") || href.startsWith("#")) return false;

	// Check if it's an absolute URL
	try {
		// Use a dummy origin for SSR compatibility
		const base =
			typeof window !== "undefined"
				? window.location.origin
				: "https://arkenv.js.org";
		const url = new URL(href, base);

		// Check against internal domains list
		const hostname = url.hostname.toLowerCase();
		if (
			INTERNAL_DOMAINS.some(
				// hostname matches exactly or is a subdomain (leading dot prevents matches like "evilarkenv.js.org")
				(domain) => hostname === domain || hostname.endsWith(`.${domain}`),
			)
		) {
			return false;
		}

		// External if different origin (only check when window is available)
		if (typeof window !== "undefined") {
			return url.origin !== window.location.origin;
		}

		// During SSR, check if it's an absolute URL with http/https
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		// If URL parsing fails, treat as internal
		return false;
	}
}

/**
 * Converts an absolute internal URL to a relative path
 * e.g. https://arkenv.js.org/docs/quickstart -> /docs/quickstart
 */
export function optimizeInternalLink(
	href: string | undefined,
): string | undefined {
	if (!href) return href;

	// Already relative
	if (href.startsWith("/") || href.startsWith("#")) return href;

	try {
		const url = new URL(href);
		const hostname = url.hostname.toLowerCase();

		// Don't optimize localhost/IPs to preserve links to local apps (e.g. in tutorials)
		if (hostname === "localhost" || hostname === "127.0.0.1") return href;

		if (
			INTERNAL_DOMAINS.some(
				(domain) => hostname === domain || hostname.endsWith(`.${domain}`),
			)
		) {
			return `${url.pathname}${url.search}${url.hash}`;
		}

		return href;
	} catch {
		return href;
	}
}
