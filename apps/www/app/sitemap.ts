import type { MetadataRoute } from "next";
import { getBlogPages, SITE_URL, source } from "~/lib/source";

function toDate(value: string | Date | undefined): Date | undefined {
	if (!value) return undefined;
	return typeof value === "string" ? new Date(value) : value;
}

export default function sitemap(): MetadataRoute.Sitemap {
	// Omit lastModified on static routes: a build-time `new Date()` churns
	// crawlers on every deploy and mislabels the runtime-revalidated roadmap.
	const staticRoutes: MetadataRoute.Sitemap = [
		{ url: SITE_URL },
		{ url: `${SITE_URL}/blog` },
		{ url: `${SITE_URL}/roadmap` },
	];

	const blogRoutes: MetadataRoute.Sitemap = getBlogPages().map((page) => {
		const lastModified = toDate(page.data.date);
		return {
			url: `${SITE_URL}${page.url}`,
			...(lastModified ? { lastModified } : {}),
		};
	});

	const docsRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({
		url: `${SITE_URL}${page.url}`,
	}));

	return [...staticRoutes, ...blogRoutes, ...docsRoutes];
}
