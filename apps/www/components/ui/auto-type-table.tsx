import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import * as JsxRuntime from "react/jsx-runtime";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { remark } from "remark";
import { remarkGfm } from "fumadocs-core/mdx-plugins/remark-gfm";
import { rehypeCode } from "fumadocs-core/mdx-plugins/rehype-code";
import remarkRehype from "remark-rehype";
import { highlightHast } from "fumadocs-core/highlight";
import { TypeTable } from "./type-table";
import { createFileSystemGeneratorCache, createGenerator } from "fumadocs-typescript";

const generator = createGenerator({
	cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

function markdownRenderer(options: any) {
	const processor = remark().use(remarkGfm).use(remarkRehype).use(rehypeCode, {
		langs: ["ts", "tsx"],
		transformers: [],
		parseMetaString: undefined,
		...options
	});
	return {
		async renderTypeToHast(type: string) {
			return {
				type: "element" as const,
				tagName: "span",
				properties: { class: "shiki" },
				children: (await highlightHast(type, {
					lang: "ts",
					structure: "inline",
					defaultColor: false,
					...options
				})).children
			};
		},
		renderMarkdownToHast(md: string) {
			const sanitized = md.replace(/{@link (?<link>[^}]*)}/g, "$1");
			return processor.run(processor.parse(sanitized));
		}
	};
}

function parseTags(tags: any[]) {
	const typed: any = {};
	for (const { name: key, text } of tags) {
		if (key === "default" || key === "defaultValue") {
			typed.default = text;
			continue;
		}
		if (key === "param") {
			const sepIdx = text.indexOf("-");
			const param = sepIdx === -1 ? text.trim() : text.slice(0, sepIdx).trim();
			const description = sepIdx === -1 ? "" : text.slice(sepIdx + 1).trim();
			typed.params ??= [];
			typed.params.push({
				name: param,
				description
			});
			continue;
		}
		if (key === "returns") typed.returns = text;
	}
	return typed;
}

function toJsx(hast: any) {
	return toJsxRuntime(hast, {
		...JsxRuntime,
		components: {
			...defaultMdxComponents,
			img: undefined
		}
	} as any);
}

export interface AutoTypeTableProps {
	name?: string;
	path?: string;
	type?: string;
	options?: any;
	shiki?: any;
}

export async function AutoTypeTable({
	name,
	path,
	type: typeProp,
	options,
	shiki,
	...props
}: AutoTypeTableProps) {
	const renderer = markdownRenderer(shiki);
	const renderType = async (v: string) => toJsx(await renderer.renderTypeToHast(v));
	const renderMarkdown = async (v: string) => toJsx(await renderer.renderMarkdownToHast(v));

	const results = await generator.generateTypeTable({
		name,
		path,
		type: typeProp
	}, options);

	const elements = await Promise.all(results.map(async (item) => {
		const entries = await Promise.all(item.entries.map(async (entry) => {
			const tags = parseTags(entry.tags);
			const paramNodes = [];
			for (const param of tags.params ?? []) {
				paramNodes.push({
					name: param.name,
					description: param.description ? await renderMarkdown(param.description) : undefined
				});
			}
			return [entry.name, {
				type: await renderType(entry.simplifiedType),
				typeDescription: await renderType(entry.type),
				typeDescriptionLink: entry.typeHref,
				description: await renderMarkdown(entry.description),
				default: tags.default ? await renderType(tags.default) : undefined,
				parameters: paramNodes,
				required: entry.required,
				deprecated: entry.deprecated,
				returns: tags.returns ? await renderMarkdown(tags.returns) : undefined
			}];
		}));

		return (
			<TypeTable
				key={item.name}
				id={`type-table-${item.id}`}
				type={Object.fromEntries(entries)}
				expandAll
				{...(props as any)}
			/>
		);
	}));

	return <>{elements}</>;
}
