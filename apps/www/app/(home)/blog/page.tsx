import "./blog.css";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "~/components/site-footer";
import { getAuthorAvatarUrl, getAuthorGithub } from "~/lib/blog-author";
import { getBlogPages } from "~/lib/source";

export const metadata: Metadata = {
	title: "Blog | ArkEnv",
	description:
		"Release notes, typed environment variable deep dives, and agent-friendly CLI guides from ArkEnv.",
};

function formatDate(date: string | Date): string {
	const value = typeof date === "string" ? new Date(date) : date;
	return value.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

function toTime(date: string | Date): number {
	return (typeof date === "string" ? new Date(date) : date).getTime();
}

export default function BlogIndexPage() {
	const pages = [...getBlogPages()].sort(
		(a, b) => toTime(b.data.date) - toTime(a.data.date),
	);

	return (
		<div className="home-aurora__shell">
			<div className="home-aurora__rails" aria-hidden="true" />
			<article className="blog-page">
				<header className="blog-page__header">
					<h1 className="blog-page__title">Blog</h1>
					<p className="blog-page__lede">
						Release notes, typed env deep dives, and agent-friendly CLI guides.
					</p>
					<a className="blog-page__rss" href="/blog/rss.xml">
						RSS feed
					</a>
				</header>

				<ul className="blog-page__list">
					{pages.map((page) => {
						const githubHandle = getAuthorGithub(
							page.data.author,
							page.data.authorGithub,
						);
						const avatarUrl = githubHandle
							? getAuthorAvatarUrl(githubHandle, 40)
							: undefined;

						return (
							<li key={page.url} className="blog-page__item">
								<Link
									href={page.url}
									className="blog-page__item-link"
									data-no-underline
									data-no-arrow
								>
									<span className="blog-page__item-meta">
										{avatarUrl ? (
											<Image
												src={avatarUrl}
												alt={page.data.author}
												width={20}
												height={20}
												className="blog-page__avatar blog-page__avatar--sm"
												unoptimized
											/>
										) : null}
										<span>{page.data.author}</span>
										<span aria-hidden="true">·</span>
										<span>{formatDate(page.data.date)}</span>
									</span>
									<span className="blog-page__item-title">
										{page.data.title}
									</span>
									{page.data.description ? (
										<p className="blog-page__item-desc">
											{page.data.description}
										</p>
									) : null}
								</Link>
							</li>
						);
					})}
				</ul>
			</article>
			<SiteFooter reveal />
		</div>
	);
}
