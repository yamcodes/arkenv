import type * as PageTree from "fumadocs-core/page-tree";
import { describe, expect, it } from "vitest";
import { getDocsTaglineSegments } from "./docs-tagline";

function page(name: string, url: string): PageTree.Item {
	return { type: "page", name, url };
}

function folder(
	name: string,
	children: PageTree.Node[],
	index?: PageTree.Item,
): PageTree.Folder {
	const node: PageTree.Folder = {
		type: "folder",
		name,
		children,
	};
	if (index) node.index = index;
	return node;
}

describe("getDocsTaglineSegments", () => {
	const referenceIndex = page("API reference", "/docs/reference");
	const options = page("options", "/docs/reference/options");
	const reference = folder(
		"API reference",
		[referenceIndex, options, page("keywords", "/docs/reference/keywords")],
		referenceIndex,
	);

	const frameworksIndex = page("Frameworks", "/docs/guides/frameworks");
	const nextjs = page("Next.js", "/docs/guides/frameworks/nextjs");
	const frameworks = folder(
		"Frameworks",
		[frameworksIndex, nextjs, page("Nuxt", "/docs/guides/frameworks/nuxt")],
		frameworksIndex,
	);
	const guidesIndex = page("Guides", "/docs/guides");
	const ai = page("Using AI with ArkEnv", "/docs/guides/ai");
	const guides = folder("Guides", [guidesIndex, ai, frameworks], guidesIndex);

	it("hides the tagline on a section Overview", () => {
		expect(
			getDocsTaglineSegments([guides, guidesIndex], "/docs/guides"),
		).toEqual([]);
	});

	it("hides the tagline on a Nested Folder Overview", () => {
		expect(
			getDocsTaglineSegments(
				[guides, frameworks, frameworksIndex],
				"/docs/guides/frameworks",
			),
		).toEqual([]);
	});

	it("returns the section name for a flat / Separator leaf (n=1)", () => {
		expect(
			getDocsTaglineSegments([reference, options], "/docs/reference/options"),
		).toEqual(["API reference"]);
	});

	it("returns NestedFolder > Page for a Nested Folder leaf (n=2)", () => {
		expect(
			getDocsTaglineSegments(
				[guides, frameworks, nextjs],
				"/docs/guides/frameworks/nextjs",
			),
		).toEqual(["Frameworks", "Next.js"]);
	});

	it("returns the section name for a section-level guide leaf", () => {
		expect(getDocsTaglineSegments([guides, ai], "/docs/guides/ai")).toEqual([
			"Guides",
		]);
	});
});
