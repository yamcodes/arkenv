"use client";

import FumadocsLink from "fumadocs-core/link";
import type { ComponentProps, FC } from "react";
import { isExternalUrl } from "@/utils/url";

export interface ExternalLinkProps extends ComponentProps<typeof FumadocsLink> {
	href?: string;
}

/**
 * ExternalLink component that automatically adds an arrow icon to external links.
 * Wraps fumadocs Link component and adds data attributes for styling.
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
		</FumadocsLink>
	);
};
