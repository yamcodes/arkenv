import type * as PageTree from "fumadocs-core/page-tree";

function norm(path: string): string {
	return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function folderIndexUrl(folder: PageTree.Folder): string | undefined {
	if (folder.index?.url) return folder.index.url;
	const pages = folder.children.filter(
		(child): child is PageTree.Item => child.type === "page",
	);
	if (pages.length === 0) return undefined;
	const index = pages.find((page) => {
		const prefix = `${norm(page.url)}/`;
		const others = folder.children.filter((child) => {
			if (child.type === "page") return child.url !== page.url;
			return child.type === "folder";
		});
		if (others.length === 0) return true;
		return others.every((child) => {
			if (child.type === "page") return norm(child.url).startsWith(prefix);
			if (child.type === "folder") {
				const url = folderIndexUrl(child);
				return url ? norm(url).startsWith(prefix) : true;
			}
			return true;
		});
	});
	return index?.url ?? pages[0]?.url;
}

function isViewingFolderIndex(
	folder: PageTree.Folder,
	pathname: string,
): boolean {
	const indexUrl = folderIndexUrl(folder);
	if (indexUrl && norm(indexUrl) === norm(pathname)) return true;

	const overviewPage = folder.children.find(
		(child): child is PageTree.Item =>
			child.type === "page" &&
			norm(child.url) === norm(pathname) &&
			(String(child.name) === String(folder.name) ||
				String(child.name) === "Overview"),
	);
	return Boolean(overviewPage);
}

/**
 * Turbo-style docs tagline segments above the page title.
 *
 * - Section / Nested Folder Overview → hidden (`[]`)
 * - Flat / Separator leaf (URL depth n=1) → `[Section]`
 * - Nested Folder leaf (URL depth n=2) → `[NestedFolder, PageTitle]`
 *
 * Separator labels are never included (they are not folders in the page tree).
 */
export function getDocsTaglineSegments(
	path: PageTree.Node[],
	pathname: string,
): string[] {
	const folders = path.filter(
		(node): node is PageTree.Folder => node.type === "folder",
	);
	if (folders.length === 0) return [];

	// Hide on every Overview (section or nested folder index).
	if (folders.some((folder) => isViewingFolderIndex(folder, pathname))) {
		return [];
	}

	const page = [...path]
		.reverse()
		.find((node): node is PageTree.Item => node.type === "page");

	// Nested Folder leaf: X > Y (folder name, then page title).
	if (folders.length >= 2 && page) {
		const nested = folders[folders.length - 1];
		return [String(nested.name), String(page.name)];
	}

	// Flat Section leaf: X (section name only).
	return [String(folders[0].name)];
}
