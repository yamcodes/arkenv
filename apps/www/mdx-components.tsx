import { TypeTable } from "@arkenv/fumadocs-ui/components";
import { arkenvComponents } from "@arkenv/fumadocs-ui/mdx";
import * as twoslashComponents from "fumadocs-twoslash/ui";
import {
	createFileSystemGeneratorCache,
	createGenerator,
} from "fumadocs-typescript";
import {
	AutoTypeTable as FumaAutoTypeTable,
	type AutoTypeTableProps,
} from "fumadocs-typescript/ui";
import {
	Callout,
	CalloutContainer,
	CalloutDescription,
	CalloutTitle,
} from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import type { MDXComponents } from "mdx/types";
import { createElement, isValidElement } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/cn";

const generator = createGenerator({
	cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

/**
 * fumadocs-typescript hardcodes stock `fumadocs-ui` TypeTable, which ignores
 * `expandAll`. Re-render generated tables through `@arkenv/fumadocs-ui`.
 */
async function AutoTypeTable(
	props: Omit<AutoTypeTableProps, "generator"> & { expandAll?: boolean },
) {
	const pending = await FumaAutoTypeTable({ ...props, generator });
	const tables = await Promise.all(pending);
	return tables.map((node, index) => {
		if (!isValidElement(node)) return node;
		return createElement(TypeTable, {
			...(node.props as object),
			key: node.key ?? index,
		});
	});
}

export function getMDXComponents(components: MDXComponents): MDXComponents {
	// biome-ignore lint/suspicious/noExplicitAny: arkenvComponents type is complex but we know it might have table
	const Table = (arkenvComponents as any).table ?? "table";
	return {
		...arkenvComponents,
		...twoslashComponents,
		Button,
		Callout,
		CalloutContainer,
		CalloutDescription,
		CalloutTitle,
		Card,
		AutoTypeTable,
		TypeTable,
		Cards,
		Files,
		Folder,
		File,
		...components,
		table: (props) => (
			<Table
				{...props}
				className={cn(
					"[&_td_code]:whitespace-nowrap [&_td:first-child]:w-max",
					props.className,
				)}
			/>
		),
	};
}
