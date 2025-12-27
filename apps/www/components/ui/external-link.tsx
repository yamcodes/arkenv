"use client";

import FumadocsLink from "fumadocs-core/link";
import { ArrowUpRight } from "lucide-react";
import type { ComponentProps, FC } from "react";

export interface ExternalLinkProps extends ComponentProps<typeof FumadocsLink> {
	href?: string;
}

/**
 * List of domains that should be treated as internal (same site)
 */
const INTERNAL_DOMAINS = [
	"arkenv.js.org",
	"www.arkenv.js.org",
	"localhost",
	"127.0.0.1",
];

/**
 * Checks if a URL is external (not same domain or not a relative path)
 */
function isExternalUrl(href: string | undefined): boolean {
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
 * ExternalLink component that automatically adds an arrow icon to external links.
 * Wraps fumadocs Link component and adds arrow icon for external URLs.
 */
export const ExternalLink: FC<ExternalLinkProps> = ({
	href,
	children,
	...props
}) => {
	const isExternal = isExternalUrl(href);

	return (
		<FumadocsLink
			href={href}
			data-external-link={isExternal || undefined}
			{...props}
		>
			{children}
			{isExternal && (
				<ArrowUpRight
					className="inline h-[0.9em] w-[0.9em] opacity-70 ml-[0.15em]"
					aria-hidden="true"
				/>
			)}
		</FumadocsLink>
	);
};
