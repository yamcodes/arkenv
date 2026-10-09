import { DocsDescription, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import Link from "next/link";
import { BlogByline } from "~/components/blog/blog-byline";
import { BlogDocsPage } from "~/components/blog/blog-docs-page";
import { getBlogPages } from "~/lib/source";

export const metadata: Metadata = {
	title: "Blog | ArkEnv",
	description:
		"Release notes, typed environment variable deep dives, and agent-friendly CLI guides from ArkEnv.",
};

function toTime(date: string | Date): number {
	return (typeof date === "string" ? new Date(date) : date).getTime();
}

export default function BlogIndexPage() {
	const pages = [...getBlogPages()].sort(
		(a, b) => toTime(b.data.date) - toTime(a.data.date),
	);

	return (
		<BlogDocsPage toc={[]}>
			<DocsTitle className="mb-0 min-w-0 text-balance">Blog</DocsTitle>
			<DocsDescription className="mt-3 mb-3">
				Release notes, typed env deep dives, and agent-friendly CLI guides.
			</DocsDescription>
			<p className="mb-8 text-fd-muted-foreground min-[960px]:mb-12">
				<a href="/blog/rss.xml">RSS feed</a>
			</p>
			<ul className="blog-index">
				{pages.map((page) => (
					<li key={page.url} className="blog-index__item">
						<Link
							href={page.url}
							className="blog-index__link"
							data-no-underline
							data-no-arrow
						>
							<BlogByline
								author={page.data.author}
								authorGithub={page.data.authorGithub}
								date={page.data.date}
								size="sm"
								linked={false}
							/>
							<span className="blog-index__title">
								{page.data.title}
								{page.data.draft ? (
									<span className="blog-draft-badge">Draft</span>
								) : null}
							</span>
							{page.data.description ? (
								<p className="blog-index__desc">{page.data.description}</p>
							) : null}
						</Link>
					</li>
				))}
			</ul>
		</BlogDocsPage>
	);
}
