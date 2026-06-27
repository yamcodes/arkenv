import { arkenvComponents } from "@arkenv/fumadocs-ui/mdx";
import * as twoslashComponents from "fumadocs-twoslash/ui";
import {
	createFileSystemGeneratorCache,
	createGenerator,
} from "fumadocs-typescript";
import { TypeTable } from "~/components/ui/type-table";
import {
	CalloutContainer,
	CalloutDescription,
	CalloutTitle,
} from "fumadocs-ui/components/callout";
import { Cards } from "fumadocs-ui/components/card";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import type { MDXComponents } from "mdx/types";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/cn";

const generator = createGenerator({
	cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

export function getMDXComponents(components: MDXComponents): MDXComponents {
	// biome-ignore lint/suspicious/noExplicitAny: arkenvComponents type is complex but we know it might have table
	const Table = (arkenvComponents as any).table ?? "table";
	return {
		...arkenvComponents,
		...twoslashComponents,
		Button,
		CalloutContainer,
		CalloutDescription,
		CalloutTitle,
		Card,
		AutoTypeTable: ({ filename, name, field, ...props }: any) => {
			const file = generator.getFile(filename);
			if (!file) throw new Error(`File ${filename} not found`);
			const exportInfo = file.exports.find((e) => e.name === name);
			if (!exportInfo) throw new Error(`Export ${name} not found`);

			const type = field ? exportInfo.types[field] : exportInfo.types;
			if (!type) throw new Error(`Field ${field} not found in ${name}`);

			return <TypeTable type={type as any} expandAll {...props} />;
		},
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
