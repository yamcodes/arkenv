import { createRelativeLink } from "fumadocs-ui/mdx";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { LLMCopyButton, ViewOptions } from "~/components/page-actions";
import { source } from "~/lib/source";
import { getMDXComponents } from "~/mdx-components";
import { getLinkTitleAndHref } from "~/lib/utils";

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
				<DocsBody>
					<MDX
						components={getMDXComponents({
							// this allows you to link to other pages with relative file paths
							a: createRelativeLink(source, page),
						})}
					/>
				</DocsBody>
			</div>
			<div className="flex flex-col items-start pt-16 gap-4">
				<div className="flex flex-row gap-2 items-center pb-8">
					<LLMCopyButton markdownUrl={`${page.url}.mdx`} />
					<ViewOptions
						markdownUrl={`${page.url}.mdx`}
						githubUrl={
							getLinkTitleAndHref(
								`${process.env.NEXT_PUBLIC_DOCS_CONTENT_PATH ?? "apps/www/content/docs/"}${page.path}`,
							).href
						}
					/>
				</div>
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
