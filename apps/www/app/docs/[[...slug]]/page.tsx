import { AIActions } from "@arkenv/fumadocs-ui/components";
import { createRelativeLink } from "fumadocs-ui/mdx";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { source } from "~/lib/source";
import { getLinkTitleAndHref } from "~/lib/utils";
import { getMDXComponents } from "~/mdx-components";

export default async function Page(props: {
	params: Promise<{ slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const MDX = page.data.body;

	return (
		<DocsPage toc={page.data.toc} full={page.data.full}>
			<div className="grow">
				<DocsTitle className="mb-4">{page.data.title}</DocsTitle>
				<DocsDescription>{page.data.description}</DocsDescription>
				<div className="flex flex-row gap-2 items-center border-b pt-2 pb-6 mb-8 mt-4">
					<AIActions
						markdownUrl={`${page.url}.mdx`}
						githubUrl={
							getLinkTitleAndHref(
								(() => {
									const basePath = (
										process.env.NEXT_PUBLIC_DOCS_CONTENT_PATH ??
										"apps/www/content/docs/"
									).replace(/\/$/, ""); // Remove trailing slash if present
									const pagePath = page.path.replace(/^\//, ""); // Remove leading slash if present
									return `${basePath}/${pagePath}`;
								})(),
							).href
						}
					/>
				</div>
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

	return {
		title: `${page.data.title} · ArkEnv`,
		description: page.data.description,
	};
}
