import { notFound } from "next/navigation";
import { llms } from "fumadocs-core/source";
import { source } from "~/lib/source";

export const revalidate = false;

interface Node {
	type: "page" | "folder" | "separator";
	$ref?: string;
	url?: string;
	index?: {
		url: string;
	};
	children?: Node[];
}

function findFolder(nodes: Node[], packageSlug: string): Node | undefined {
	for (const node of nodes) {
		if (node.type === "folder") {
			// 1. If it has an index, does its index.url match `/docs/${packageSlug}`?
			if (node.index && node.index.url === `/docs/${packageSlug}`) {
				return node;
			}
			// 2. Or, does its $ref contain the slug?
			if (node.$ref && (node.$ref.includes(`${packageSlug}/meta.json`) || node.$ref.includes(`${packageSlug}/`))) {
				return node;
			}
			// 3. Or, do any of its child pages have a URL that starts with `/docs/${packageSlug}`?
			const hasMatchingPage = node.children?.some(
				(child) =>
					child.type === "page" &&
					child.url &&
					(child.url === `/docs/${packageSlug}` || child.url.startsWith(`/docs/${packageSlug}/`))
			);
			if (hasMatchingPage) {
				return node;
			}

			// Recursively search children
			if (node.children) {
				const found = findFolder(node.children, packageSlug);
				if (found) return found;
			}
		}
	}
	return undefined;
}

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ package: string }> }
) {
	const { package: packageSlug } = await params;
	
	const tree = source.getPageTree();
	const folderNode = findFolder(tree.children as unknown as Node[], packageSlug);

	if (!folderNode) {
		notFound();
	}

	const indexContent = llms(source).indexNode(folderNode as any);

	return new Response(indexContent, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
}

export function generateStaticParams() {
	return [
		{ package: "arkenv" },
		{ package: "cli" },
		{ package: "bun-plugin" },
		{ package: "nextjs" },
		{ package: "vite-plugin" },
	];
}
