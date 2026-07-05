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
// Derived from fumadocs-ui (https://fumadocs.dev), used under MIT.

"use client";

import { cva } from "class-variance-authority";
import Link from "fumadocs-core/link";
import { ChevronDown } from "lucide-react";
import {
	type ComponentProps,
	type ReactNode,
	useEffect,
	useState,
} from "react";
import { cn } from "~/lib/cn";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./collapsible";

export type ParameterNode = {
	name: string;
	description: ReactNode;
};

export type TypeNode = {
	/**
	 * Additional description of the field
	 */
	description?: ReactNode;

	/**
	 * type signature (short)
	 */
	type: ReactNode;

	/**
	 * type signature (full)
	 */
	typeDescription?: ReactNode;

	/**
	 * Optional `href` for the type
	 */
	typeDescriptionLink?: string;

	default?: ReactNode;

	required?: boolean;
	deprecated?: boolean;

	/**
	 * a list of parameters info if the type is a function.
	 */
	parameters?: ParameterNode[];

	returns?: ReactNode;
};

const fieldVariants = cva("text-fd-muted-foreground not-prose pe-2");

export function TypeTable({
	id,
	type,
	className,
	expandAll = false,
	...props
}: {
	type: Record<string, TypeNode>;
	expandAll?: boolean;
} & ComponentProps<"div">) {
	return (
		<div
			id={id}
			className={cn(
				"@container flex flex-col p-1 bg-fd-card text-fd-card-foreground rounded-2xl border my-6 text-sm overflow-hidden",
				className,
			)}
			{...props}
		>
			<div className="flex font-medium items-center px-3 py-1 not-prose text-fd-muted-foreground">
				<p className="w-1/4">Prop</p>
				<p className="@max-xl:hidden">Type</p>
			</div>
			{Object.entries(type).map(([key, value]) => (
				<Item
					key={key}
					parentId={id}
					name={key}
					item={value}
					defaultOpen={expandAll}
				/>
			))}
		</div>
	);
}

function Item({
	parentId,
	name,
	item: {
		parameters = [],
		description,
		required = false,
		deprecated,
		typeDescription,
		default: defaultValue,
		type,
		typeDescriptionLink,
		returns,
	},
	defaultOpen = false,
}: {
	parentId?: string;
	name: string;
	item: TypeNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);
	const id = parentId ? `${parentId}-${name}` : undefined;

	useEffect(() => {
		const hash = window.location.hash;
		if (!id || !hash) return;
		if (`#${id}` === hash) setOpen(true);
	}, [id]);

	return (
		<Collapsible
			id={id}
			open={open}
			onOpenChange={(v) => {
				if (v && id) {
					window.history.replaceState(null, "", `#${id}`);
				}
				setOpen(v);
			}}
			className={cn(
				"rounded-xl border overflow-hidden scroll-m-20 transition-all",
				open
					? "shadow-sm bg-fd-background not-last:mb-2"
					: "border-transparent",
			)}
		>
			<CollapsibleTrigger className="relative flex flex-row items-center w-full group text-start px-3 py-2 not-prose hover:bg-fd-accent">
				<code
					className={cn(
						"text-fd-primary min-w-fit w-1/4 font-mono font-medium pe-2",
						deprecated && "line-through text-fd-primary/50",
					)}
				>
					{name}
					{!required && "?"}
				</code>
				{typeDescriptionLink ? (
					<Link href={typeDescriptionLink} className="underline @max-xl:hidden">
						{type}
					</Link>
				) : (
					<span className="@max-xl:hidden">{type}</span>
				)}
				<ChevronDown className="absolute end-2 size-4 text-fd-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="grid grid-cols-[1fr_3fr] gap-y-4 text-sm p-3 overflow-auto fd-scroll-container border-t">
					<div className="text-sm prose col-span-full prose-no-margin empty:hidden">
						{description}
					</div>
					{typeDescription && (
						<>
							<p className={cn(fieldVariants())}>Type</p>
							<p className="my-auto not-prose">{typeDescription}</p>
						</>
					)}
					{defaultValue && (
						<>
							<p className={cn(fieldVariants())}>Default</p>
							<p className="my-auto not-prose">{defaultValue}</p>
						</>
					)}
					{parameters.length > 0 && (
						<>
							<p className={cn(fieldVariants())}>Parameters</p>
							<div className="flex flex-col gap-2">
								{parameters.map((param) => (
									<div
										key={param.name}
										className="inline-flex items-center flex-wrap gap-1"
									>
										<p className="font-medium not-prose text-nowrap">
											{param.name} -
										</p>
										<div className="text-sm prose prose-no-margin">
											{param.description}
										</div>
									</div>
								))}
							</div>
						</>
					)}
					{returns && (
						<>
							<p className={cn(fieldVariants())}>Returns</p>
							<div className="my-auto text-sm prose prose-no-margin">
								{returns}
							</div>
						</>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
