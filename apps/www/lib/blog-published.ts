/**
 * Pure draft filter used by `getBlogPages()`.
 * Drafts are included only when `nodeEnv === "development"`;
 * production listing, RSS, and sitemap always omit drafts.
 */
export function isPublishedBlogPage(
	page: { data: { draft?: boolean } },
	nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
	if (page.data.draft) {
		return nodeEnv === "development";
	}
	return true;
}
