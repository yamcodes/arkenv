/**
 * List of domains that should be treated as "our" application.
 * Note: Localhost is intentionally excluded here to prevent "Open localhost:3000" tutorial links
 * from being treated as internal navigation on the production site.
 */
export const INTERNAL_DOMAINS = ["arkenv.js.org", "www.arkenv.js.org"];

/**
 * Checks if a hostname belongs to our internal domains list.
 */
function isInternalDomain(hostname: string): boolean {
	return INTERNAL_DOMAINS.some(
		// hostname matches exactly or is a subdomain (leading dot prevents matches like "evilarkenv.js.org")
		(domain) => hostname === domain || hostname.endsWith(`.${domain}`),
	);
}

/**
 * Check if a URL is external (not same domain or not a relative path)
 *
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
		const hostname = url.hostname.toLowerCase();

		// check explicit internal domains
		if (isInternalDomain(hostname)) {
			return false;
		}

		// External if different origin (only check when window is available)
		if (typeof window !== "undefined") {
			return url.origin !== window.location.origin;
		}

		// During SSR, check if it's an absolute URL with http/https
		// Note: We treat localhost as external during SSR if not in the optional allowed list
		// to avoid hydration mismatches if possible, but mostly to err on side of caution.
		if (hostname === "localhost" || hostname === "127.0.0.1") {
			// If we are strictly checking, localhost is external to arkenv.js.org
			return true;
		}

		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		// If URL parsing fails, treat as internal
		return false;
	}
}

/**
 * Convert an absolute internal URL to a relative path
 * e.g. https://arkenv.js.org/docs/quickstart -> /docs/quickstart
 *
 * This enables links to the production site (e.g. in READMEs) to:
 * 1. Work instantly via client-side routing
 * 2. Work correctly on Localhost (keeping you on localhost)
 * 3. Work correctly on Deploy Previews (keeping you on the preview)
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

		// Only optimize if it matches our production domains.
		// We purposefully do NOT optimize localhost here, preserving "tutorial style" links.
		if (isInternalDomain(hostname)) {
			return `${url.pathname}${url.search}${url.hash}`;
		}

		return href;
	} catch {
		return href;
	}
}
