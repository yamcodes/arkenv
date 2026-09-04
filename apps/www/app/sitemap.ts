import type { MetadataRoute } from "next";
import { getBlogPages, SITE_URL, source } from "~/lib/source";

function toDate(value: string | Date | undefined): Date | undefined {
	if (!value) return undefined;
	return typeof value === "string" ? new Date(value) : value;
}

export default function sitemap(): MetadataRoute.Sitemap {
	const staticRoutes: MetadataRoute.Sitemap = [
		{ url: SITE_URL, lastModified: new Date() },
		{ url: `${SITE_URL}/blog`, lastModified: new Date() },
		{ url: `${SITE_URL}/roadmap`, lastModified: new Date() },
	];

	const blogRoutes: MetadataRoute.Sitemap = getBlogPages().map((page) => ({
		url: `${SITE_URL}${page.url}`,
		lastModified: toDate(page.data.date) ?? new Date(),
	}));

	const docsRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({
		url: `${SITE_URL}${page.url}`,
	}));

	return [...staticRoutes, ...blogRoutes, ...docsRoutes];
}
