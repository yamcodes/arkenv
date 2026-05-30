import { llms } from "fumadocs-core/source";
import { notFound } from "next/navigation";
import { source } from "~/lib/source";

export const revalidate = false;

/**
 * Node definition for page tree traversal.
 */
type Node = {
	type: "page" | "folder" | "separator";
	$ref?: string;
	url?: string;
	index?: {
		url: string;
	};
	children?: Node[];
};

/**
 * Traverse the page tree nodes to find the folder corresponding to the package slug.
 *
 * @param nodes The page tree nodes to search
 * @param packageSlug The package folder/slug name
 * @returns The matching Folder node, or undefined if not found
 */
function findFolder(nodes: Node[], packageSlug: string): Node | undefined {
	for (const node of nodes) {
		if (node.type === "folder") {
			// 1. If it has an index, does its index.url match `/docs/${packageSlug}`?
			if (node.index && node.index.url === `/docs/${packageSlug}`) {
				return node;
			}
			// 2. Or, does its $ref contain the slug?
			if (
				node.$ref &&
				(node.$ref.includes(`${packageSlug}/meta.json`) ||
					node.$ref.includes(`${packageSlug}/`))
			) {
				return node;
			}
			// 3. Or, do any of its child pages have a URL that starts with `/docs/${packageSlug}`?
			const hasMatchingPage = node.children?.some(
				(child) =>
					child.type === "page" &&
					child.url &&
					(child.url === `/docs/${packageSlug}` ||
						child.url.startsWith(`/docs/${packageSlug}/`)),
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

/**
 * Handle GET requests for package-specific llms.txt endpoints.
 *
 * @param _req The incoming HTTP request
 * @param context The route parameters context
 * @returns A Response containing the plain-text index of the package documentation
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ package: string }> },
) {
	const { package: packageSlug } = await params;

	const tree = source.getPageTree();
	const folderNode = findFolder(
		tree.children as unknown as Node[],
		packageSlug,
	);

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

/**
 * Generate static parameters for all packages present in the page collection slugs.
 *
 * @returns The array of package slug parameters
 */
export function generateStaticParams() {
	const packages = new Set<string>();
	for (const page of source.getPages()) {
		if (page.slugs[0]) {
			packages.add(page.slugs[0]);
		}
	}
	return Array.from(packages).map((pkg) => ({ package: pkg }));
}
