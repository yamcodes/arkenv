"use client";

import parse, {
	Element as HtmlElement,
	domToReact,
	type HTMLReactParserOptions,
	type DOMNode,
} from "html-react-parser";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import { useMemo } from "react";

export function TwoslashHover({
	html,
	className,
}: {
	html: string;
	className?: string;
}) {
	const content = useMemo(() => {
		const options: HTMLReactParserOptions = {
			replace: (domNode) => {
				if (!(domNode instanceof HtmlElement)) return;

				const tagName = domNode.tagName.toLowerCase();

				if (tagName === "popup") {
					const children = domNode.children ?? [];
					const contentNode = children.find(
						(c): c is HtmlElement =>
							c instanceof HtmlElement &&
							c.tagName.toLowerCase() === "popupcontent",
					);
					const triggerNode = children.find(
						(c): c is HtmlElement =>
							c instanceof HtmlElement &&
							c.tagName.toLowerCase() === "popuptrigger",
					);

					return (
						<Popup>
							{contentNode && (
								<PopupContent className="nd-copy-ignore">
									{domToReact(contentNode.children as DOMNode[])}
								</PopupContent>
							)}
							{triggerNode && (
								<PopupTrigger>
									{domToReact(triggerNode.children as DOMNode[])}
								</PopupTrigger>
							)}
						</Popup>
					);
				}

				return;
			},
		};

		return parse(html, options);
	}, [html]);

	return <div className={className}>{content}</div>;
}
