// MIT License
//
// Copyright (c) 2023 Fuma
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Derived from fumadocs-typescript (https://fumadocs.dev), used under MIT.

import { highlightHast } from "fumadocs-core/highlight";
import { rehypeCode } from "fumadocs-core/mdx-plugins/rehype-code";
import { remarkGfm } from "fumadocs-core/mdx-plugins/remark-gfm";
import {
	createFileSystemGeneratorCache,
	createGenerator,
} from "fumadocs-typescript";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { ElementContent, Nodes } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { ComponentProps } from "react";
import * as JsxRuntime from "react/jsx-runtime";
import { remark } from "remark";
import remarkRehype from "remark-rehype";
import { TypeTable } from "./type-table";

const generator = createGenerator({
	cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

type GenerateTypeTableOptions = Parameters<
	(typeof generator)["generateTypeTable"]
>[1];

type ShikiOptions = Record<string, unknown>;

function markdownRenderer(options?: ShikiOptions) {
	const processor = remark()
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeCode, {
			langs: ["ts", "tsx"],
			transformers: [],
			parseMetaString: undefined,
			...options,
		});
	return {
		async renderTypeToHast(type: string) {
			return {
				type: "element" as const,
				tagName: "span",
				properties: { class: "shiki" },
				children: [
					{
						type: "element" as const,
						tagName: "code",
						properties: {},
						children: (
							await highlightHast(type, {
								lang: "ts",
								structure: "inline",
								defaultColor: false,
								...options,
							})
						).children as ElementContent[],
					},
				],
			};
		},
		renderMarkdownToHast(md: string) {
			const sanitized = md.replace(/{@link (?<link>[^}]*)}/g, "$1");
			return processor.run(processor.parse(sanitized));
		},
	};
}

function parseTags(tags: { name: string; text: string }[]) {
	const typed: {
		default?: string;
		params?: { name: string; description: string }[];
		returns?: string;
	} = {};
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
				description,
			});
			continue;
		}
		if (key === "returns") typed.returns = text;
	}
	return typed;
}

function toJsx(hast: Nodes) {
	return toJsxRuntime(hast, {
		...JsxRuntime,
		components: {
			...defaultMdxComponents,
			img: undefined,
		},
	} as any);
}

export type AutoTypeTableProps = {
	name?: string;
	path?: string;
	type?: string;
	options?: GenerateTypeTableOptions;
	shiki?: ShikiOptions;
} & ComponentProps<"div">;

export async function AutoTypeTable({
	name,
	path,
	type: typeProp,
	options,
	shiki,
	...props
}: AutoTypeTableProps) {
	const renderer = markdownRenderer(shiki);
	const renderType = async (v: string) =>
		toJsx(await renderer.renderTypeToHast(v));
	const renderMarkdown = async (v: string) =>
		toJsx(await renderer.renderMarkdownToHast(v));

	const results = await generator.generateTypeTable(
		{
			name,
			path,
			type: typeProp,
		},
		options,
	);

	const elements = await Promise.all(
		results.map(async (item) => {
			const entries = await Promise.all(
				item.entries.map(async (entry) => {
					const tags = parseTags(entry.tags);
					const paramNodes = [];
					for (const param of tags.params ?? []) {
						paramNodes.push({
							name: param.name,
							description: param.description
								? await renderMarkdown(param.description)
								: undefined,
						});
					}
					return [
						entry.name,
						{
							type: await renderType(entry.simplifiedType),
							typeDescription: await renderType(entry.type),
							typeDescriptionLink: entry.typeHref,
							description: await renderMarkdown(entry.description),
							default: tags.default
								? await renderType(tags.default)
								: undefined,
							parameters: paramNodes,
							required: entry.required,
							deprecated: entry.deprecated,
							returns: tags.returns
								? await renderMarkdown(tags.returns)
								: undefined,
						},
					];
				}),
			);

			return (
				<TypeTable
					key={item.name}
					id={`type-table-${item.id}`}
					type={Object.fromEntries(entries)}
					expandAll
					{...props}
				/>
			);
		}),
	);

	return <>{elements}</>;
}
