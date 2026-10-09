import { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogByline } from "~/components/blog/blog-byline";
import { BlogDocsPage } from "~/components/blog/blog-docs-page";
import { isPublishedBlogPage } from "~/lib/blog-published";
import { blog, getBlogPages, SITE_URL } from "~/lib/source";
import { getLinkTitleAndHref } from "~/lib/utils";
import { getMDXComponents } from "~/mdx-components";

const BLOG_CONTENT_DIR = "apps/www/content/blog";

function getBlogEditHref(pagePath: string): string {
	const normalizedPath = pagePath.replace(/^\/+/, "");
	return getLinkTitleAndHref(`${BLOG_CONTENT_DIR}/${normalizedPath}`).href;
}

export default async function BlogPostPage(props: {
	params: Promise<{ slug: string }>;
}) {
	const params = await props.params;
	const page = blog.getPage([params.slug]);
	if (!page || !isPublishedBlogPage(page)) notFound();

	const MDX = page.data.body;

	return (
		<BlogDocsPage
			pageTitle={page.data.title}
			editHref={getBlogEditHref(page.path)}
			toc={page.data.toc}
		>
			<DocsTitle className="mb-0 min-w-0 text-balance">
				{page.data.title}
				{page.data.draft ? (
					<span className="blog-draft-badge">Draft</span>
				) : null}
			</DocsTitle>
			<BlogByline
				className="mt-4"
				author={page.data.author}
				authorGithub={page.data.authorGithub}
				date={page.data.date}
			/>
			<DocsDescription className="mt-3 mb-8 min-[960px]:mb-12">
				{page.data.description}
			</DocsDescription>
			<DocsBody>
				<MDX
					components={getMDXComponents({
						a: createRelativeLink(blog, page),
					})}
				/>
			</DocsBody>
		</BlogDocsPage>
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
	if (!page || !isPublishedBlogPage(page)) notFound();

	const ogUrl = new URL(`${SITE_URL}/api/og`);
	ogUrl.searchParams.set("title", page.data.title);
	if (page.data.description) {
		ogUrl.searchParams.set("description", page.data.description);
	}

	return {
		title: `${page.data.title} | ArkEnv`,
		description: page.data.description,
		robots: page.data.draft ? { index: false, follow: false } : undefined,
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
