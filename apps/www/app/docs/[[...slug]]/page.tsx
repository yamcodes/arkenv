import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { EditOnGithub } from "~/components/page/edit-on-github";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
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
					<DocsTitle className="mb-4">{page.data.title}</DocsTitle>
					<DocsDescription>{page.data.description}</DocsDescription>
					<DocsBody>
						<MDX
							components={{
								...defaultMdxComponents,
								Tab,
								Tabs,
								Button,
								Card,
								Step,
								Steps,
								Accordion,
								Accordions,
								pre: ({ ref: _ref, ...props }) => (
									<CodeBlock {...props}>
										<Pre>{props.children}</Pre>
									</CodeBlock>
								),
							}}
						/>
					</DocsBody>
				</div>
				<div className="flex flex-col items-start pt-16">
					<EditOnGithub path={page.path} />
					<div className="mt-8 w-full">
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
		title: `${page.data.title} · ArkEnv`,
		description: page.data.description,
	};
}
