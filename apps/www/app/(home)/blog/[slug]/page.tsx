import "../blog.css";
import { InlineTOC } from "fumadocs-ui/components/inline-toc";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "~/components/site-footer";
import { getAuthorAvatarUrl, getAuthorGithub } from "~/lib/blog-author";
import { blog, getBlogPages, SITE_URL } from "~/lib/source";
import { getMDXComponents } from "~/mdx-components";

function formatDate(date: string | Date): string {
	const value = typeof date === "string" ? new Date(date) : date;
	return value.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});
}

export default async function BlogPostPage(props: {
	params: Promise<{ slug: string }>;
}) {
	const params = await props.params;
	const page = blog.getPage([params.slug]);
	if (!page) notFound();
	if (page.data.draft && process.env.NODE_ENV !== "development") notFound();

	const MDX = page.data.body;
	const githubHandle = getAuthorGithub(
		page.data.author,
		page.data.authorGithub,
	);
	const avatarUrl = githubHandle
		? getAuthorAvatarUrl(githubHandle, 64)
		: undefined;
	const githubUrl = githubHandle
		? `https://github.com/${githubHandle}`
		: undefined;

	return (
		<div className="home-aurora__shell">
			<div className="home-aurora__rails" aria-hidden="true" />
			<article className="blog-page">
				<div className="blog-page__post">
					<Link
						href="/blog"
						className="blog-page__back"
						data-no-underline
						data-no-arrow
					>
						← Blog
					</Link>
					<header className="blog-page__header">
						<h1 className="blog-page__title">{page.data.title}</h1>
						{page.data.description ? (
							<p className="blog-page__lede">{page.data.description}</p>
						) : null}
						<div className="blog-page__post-author">
							{avatarUrl ? (
								githubUrl ? (
									<a
										href={githubUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="blog-page__author-avatar-link"
										aria-label={`${page.data.author} on GitHub`}
										data-no-underline
										data-no-arrow
									>
										<Image
											src={avatarUrl}
											alt={page.data.author}
											width={32}
											height={32}
											className="blog-page__avatar"
											unoptimized
										/>
									</a>
								) : (
									<Image
										src={avatarUrl}
										alt={page.data.author}
										width={32}
										height={32}
										className="blog-page__avatar"
										unoptimized
									/>
								)
							) : null}
							<div className="blog-page__author-details">
								{githubUrl ? (
									<a
										href={githubUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="blog-page__author-name"
										data-no-underline
										data-no-arrow
									>
										{page.data.author}
									</a>
								) : (
									<span className="blog-page__author-name">
										{page.data.author}
									</span>
								)}
								<span className="blog-page__post-date">
									{formatDate(page.data.date)}
								</span>
							</div>
						</div>
					</header>
					<div className="blog-page__post-body prose">
						<InlineTOC items={page.data.toc} />
						<MDX components={getMDXComponents({})} />
					</div>
				</div>
			</article>
			<SiteFooter reveal />
		</div>
	);
}

export function generateStaticParams() {
	return getBlogPages().map((page) => ({
		slug: page.slugs[0],
	}));
}

export async function generateMetadata(props: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const params = await props.params;
	const page = blog.getPage([params.slug]);
	if (!page) notFound();
	if (page.data.draft && process.env.NODE_ENV !== "development") notFound();

	const ogUrl = new URL(`${SITE_URL}/api/og`);
	ogUrl.searchParams.set("title", page.data.title);
	if (page.data.description) {
		ogUrl.searchParams.set("description", page.data.description);
	}

	return {
		title: `${page.data.title} | ArkEnv`,
		description: page.data.description,
		openGraph: {
			title: `${page.data.title} | ArkEnv`,
			description: page.data.description,
			images: [
				{
					url: ogUrl.toString(),
					width: 1200,
					height: 630,
					alt: page.data.title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: `${page.data.title} | ArkEnv`,
			description: page.data.description,
			images: [ogUrl.toString()],
		},
	};
}
