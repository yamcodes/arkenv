import {
	AIActions,
	DocsBreadcrumb,
	DocsFooter,
	docsTocSlots,
} from "@arkenv/fumadocs-ui/components";
import { createRelativeLink } from "fumadocs-ui/mdx";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { DocsTocLinks } from "~/components/docs/toc-links";
import { env } from "~/env";
import { FeatureFlags } from "~/lib/feature-flags";
import { source } from "~/lib/source";
import { getLinkTitleAndHref } from "~/lib/utils";
import { getMDXComponents } from "~/mdx-components";

function getDocsEditHref(pagePath: string): string {
	const basePath = env.NEXT_PUBLIC_DOCS_CONTENT_PATH.replace(/\/$/, "");
	const normalizedPath = pagePath.replace(/^\/+/, "");
	return getLinkTitleAndHref(`${basePath}/${normalizedPath}`).href;
}

export default async function Page(props: {
	params: Promise<{ slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const MDX = page.data.body;
	const full = page.data.full;
	const editHref = getDocsEditHref(page.path);
	const tocLinks = (
		<DocsTocLinks pageTitle={page.data.title} editHref={editHref} />
	);

	// Floating Site Nav conflicts with the sticky TOC popover below 1200px; keep the desktop TOC rail only.
	// Re-enable via FeatureFlags.DOCS_TOC_POPOVER / NEXT_PUBLIC_DOCS_TOC_POPOVER=true.
	return (
		<DocsPage
			toc={page.data.toc}
			full={full}
			tableOfContent={{ enabled: !full, footer: tocLinks, single: true }}
			tableOfContentPopover={{
				enabled: FeatureFlags.DOCS_TOC_POPOVER,
				footer: tocLinks,
			}}
			slots={{
				breadcrumb: DocsBreadcrumb,
				footer: DocsFooter,
				toc: docsTocSlots,
			}}
		>
			<div className="grow">
				<div className="flex flex-col gap-4 min-[960px]:flex-row min-[960px]:items-end min-[960px]:justify-between">
					<DocsTitle className="mb-0 min-w-0 text-balance">
						{page.data.title}
					</DocsTitle>
					<AIActions
						only="desktop"
						className="self-end"
						markdownUrl={`${page.url}.mdx`}
						pageUrl={page.url}
						githubUrl={editHref}
					/>
				</div>
				<DocsDescription className="mt-3 mb-8 min-[960px]:mb-12">
					{page.data.description}
				</DocsDescription>
				<AIActions
					only="mobile"
					className="mb-8"
					markdownUrl={`${page.url}.mdx`}
					pageUrl={page.url}
					githubUrl={editHref}
				/>
				<DocsBody>
					<MDX
						components={getMDXComponents({
							// this allows you to link to other pages with relative file paths
							a: createRelativeLink(source, page),
						})}
					/>
				</DocsBody>
			</div>
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(props: {
	params: Promise<{ slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const ogUrl = new URL("https://arkenv.js.org/api/og");
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
