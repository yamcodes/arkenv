/**
 * Whether draft blog posts may be listed and rendered.
 *
 * - Vercel production (`VERCEL_ENV=production`): never
 * - Vercel preview / development: yes
 * - Local without `VERCEL_ENV`: yes only when `NODE_ENV !== "production"`
 *   (`next dev`), so `next build` + `next start` stay draft-free
 */
export function allowBlogDrafts(
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	const vercelEnv = env.VERCEL_ENV?.trim();
	if (vercelEnv) {
		return vercelEnv !== "production";
	}
	return env.NODE_ENV !== "production";
}

/**
 * Pure draft filter used by `getBlogPages()`.
 * Drafts are included on local `next dev` and Vercel preview / branch
 * deploys; production listing, RSS, and sitemap always omit them.
 */
export function isPublishedBlogPage(
	page: { data: { draft?: boolean } },
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	if (!page.data.draft) {
		return true;
	}
	return allowBlogDrafts(env);
}
