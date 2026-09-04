import RSS from "rss";
import { getBlogPages, SITE_URL } from "~/lib/source";

export const revalidate = false;

export function GET() {
	const feed = new RSS({
		title: "ArkEnv Blog",
		description:
			"Release notes, typed environment variable deep dives, and agent-friendly CLI guides.",
		feed_url: `${SITE_URL}/blog/rss.xml`,
		site_url: SITE_URL,
		language: "en",
	});

	for (const page of getBlogPages()) {
		feed.item({
			title: page.data.title,
			description: page.data.description ?? "",
			url: `${SITE_URL}${page.url}`,
			date: page.data.date,
			author: page.data.author,
		});
	}

	return new Response(feed.xml({ indent: true }), {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
		},
	});
}
