import defaultMdxComponents from "fumadocs-ui/mdx";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { EditOnGithub } from "~/components/page/edit-on-github";
import { Separator } from "~/components/ui/separator";
import { source } from "~/lib/source";

export default async function Page(props: {
	params: Promise<{ slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const MDX = page.data.body;

	return (
		<DocsPage toc={page.data.toc} full={page.data.full}>
			<div className="flex flex-col h-full">
				<div className="flex-grow">
					<DocsTitle>{page.data.title}</DocsTitle>
					<DocsDescription>{page.data.description}</DocsDescription>
					<DocsBody>
						<MDX components={{ ...defaultMdxComponents }} />
					</DocsBody>
				</div>
				<div className="flex flex-col pt-16">
					<EditOnGithub path={page.file.path} />
					<div className="mt-8">
						<Separator />
					</div>
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
		title: `${page.data.title} · ark.env`,
		description: page.data.description,
	};
}
