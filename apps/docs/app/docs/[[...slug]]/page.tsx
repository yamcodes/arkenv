import { source } from "@/lib/source";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const HorizontalLine = () => {
	return <div className="w-full h-px bg-gray-200" />;
};

const getLinkTitleAndHref = (path?: string) => {
	try {
		if (!path) throw Error();
		const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;
		if (!githubUrl) throw Error();
		const sha = "main";
		const cleanUrl = githubUrl.replace(/\/$/, "");
		const urlParts = cleanUrl.split("/");
		const owner = urlParts[urlParts.length - 2];
		const repo = urlParts[urlParts.length - 1];
		if (!owner || !repo) throw Error();
		const title = `Editing ${repo}/${path} at ${sha} · ${owner}/${repo}`;
		const href = `${githubUrl}/edit/${sha}/${path}`;
		return { title, href };
	} catch {
		return { title: "Edit this page on GitHub", href: "https://http.cat/404" };
	}
};

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
					<Link
						{...getLinkTitleAndHref(`apps/docs/content/docs/${page.file.path}`)}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors"
					>
						<SquarePen className="w-4 h-4" />
						Edit this page on GitHub
					</Link>
					<div className="mt-8">
						<HorizontalLine />
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
