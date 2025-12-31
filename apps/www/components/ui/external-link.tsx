"use client";

import FumadocsLink from "fumadocs-core/link";
import type { ComponentProps, FC } from "react";
import { isExternalUrl, optimizeInternalLink } from "~/lib/utils/url";

export interface ExternalLinkProps extends ComponentProps<typeof FumadocsLink> {
	href?: string;
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
	const finalHref = optimizeInternalLink(href);
	const isExternal = isExternalUrl(finalHref);

	return (
		<FumadocsLink
			href={finalHref}
			data-external-link={isExternal || undefined}
			{...props}
		>
			{children}
		</FumadocsLink>
	);
};
