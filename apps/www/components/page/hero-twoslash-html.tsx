"use client";

import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import {
	type CSSProperties,
	createElement,
	type ReactNode,
	useId,
} from "react";

type HeroTwoslashHtmlProps = {
	html: string;
	active: boolean;
};

const VOID_TAGS = new Set(["br", "hr", "img", "input", "meta", "link"]);

/**
 * Shiki Twoslash HTML with the same portaled Fumadocs popovers as the docs.
 */
export function HeroTwoslashHtml({ html, active }: HeroTwoslashHtmlProps) {
	const keyPrefix = useId();
	return (
		<div className="home-aurora__shiki home-aurora__mvp-shiki">
			{parseShikiHtml(html, { enablePopups: active, keyPrefix })}
		</div>
	);
}

type ParseOptions = {
	enablePopups: boolean;
	keyPrefix: string;
};

function parseShikiHtml(html: string, options: ParseOptions): ReactNode[] {
	const nodes: ReactNode[] = [];
	let i = 0;
	let n = 0;
	while (i < html.length) {
		if (html[i] !== "<") {
			const next = html.indexOf("<", i);
			const text = html.slice(i, next === -1 ? html.length : next);
			if (text) nodes.push(decodeEntities(text));
			i = next === -1 ? html.length : next;
			continue;
		}
		if (html.startsWith("</", i)) break;
		if (html.startsWith("<!--", i)) {
			const end = html.indexOf("-->", i + 4);
			i = end === -1 ? html.length : end + 3;
			continue;
		}
		const parsed = readElement(html, i);
		nodes.push(elementToReact(parsed, options, `${options.keyPrefix}-${n}`));
		n += 1;
		i = parsed.end;
	}
	return nodes;
}

type ParsedElement = {
	tag: string;
	attrs: Record<string, string>;
	inner: string;
	end: number;
};

function readElement(html: string, start: number): ParsedElement {
	const gt = html.indexOf(">", start);
	if (gt === -1) {
		throw new Error("unterminated tag");
	}
	const selfClosing = html[gt - 1] === "/";
	const opening = html.slice(start + 1, selfClosing ? gt - 1 : gt);
	const space = opening.search(/\s/);
	const tag = (space === -1 ? opening : opening.slice(0, space)).toLowerCase();
	const attrSource = space === -1 ? "" : opening.slice(space);
	if (selfClosing || VOID_TAGS.has(tag)) {
		return { tag, attrs: parseAttrs(attrSource), inner: "", end: gt + 1 };
	}
	const innerStart = gt + 1;
	const end = findClose(html, innerStart, tag);
	return {
		tag,
		attrs: parseAttrs(attrSource),
		inner: html.slice(innerStart, end.open),
		end: end.close,
	};
}

function findClose(
	html: string,
	from: number,
	tag: string,
): { open: number; close: number } {
	const openRe = new RegExp(`<${tag}(?=[\\s>/])`, "gi");
	const closeRe = new RegExp(`</${tag}>`, "gi");
	let depth = 1;
	let i = from;
	while (depth > 0 && i < html.length) {
		openRe.lastIndex = i;
		closeRe.lastIndex = i;
		const nextOpen = openRe.exec(html);
		const nextClose = closeRe.exec(html);
		if (!nextClose) {
			throw new Error(`unclosed <${tag}>`);
		}
		if (nextOpen && nextOpen.index < nextClose.index) {
			depth += 1;
			i = openRe.lastIndex;
		} else {
			depth -= 1;
			i = closeRe.lastIndex;
			if (depth === 0) {
				return { open: nextClose.index, close: i };
			}
		}
	}
	throw new Error(`unclosed <${tag}>`);
}

function parseAttrs(source: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	const re = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
	let match = re.exec(source);
	while (match) {
		const name = match[1];
		if (name) {
			attrs[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
		}
		match = re.exec(source);
	}
	return attrs;
}

function elementToReact(
	el: ParsedElement,
	options: ParseOptions,
	key: string,
): ReactNode {
	if (hasClass(el.attrs.class, "twoslash-hover")) {
		return hoverToReact(el, options, key);
	}
	const children = parseShikiHtml(el.inner, {
		...options,
		keyPrefix: `${key}-`,
	});
	return createElement(el.tag, { ...domProps(el.attrs), key }, ...children);
}

function hoverToReact(
	el: ParsedElement,
	options: ParseOptions,
	key: string,
): ReactNode {
	const popup = firstChildByClass(el.inner, "twoslash-popup-container");
	const tokenHtml = popup ? el.inner.slice(popup.end) : el.inner;
	const token = parseShikiHtml(tokenHtml, {
		...options,
		keyPrefix: `${key}-t`,
	});
	if (!options.enablePopups || !popup) {
		return createElement(
			el.tag,
			{ ...domProps(el.attrs), key },
			...parseShikiHtml(el.inner, { ...options, keyPrefix: `${key}-i` }),
		);
	}
	const popupBody = parseShikiHtml(popup.inner, {
		...options,
		keyPrefix: `${key}-p`,
	});
	return (
		<Popup key={key} delay={300}>
			<PopupTrigger>{token}</PopupTrigger>
			<PopupContent side="bottom" align="start">
				{popupBody}
			</PopupContent>
		</Popup>
	);
}

function firstChildByClass(
	html: string,
	className: string,
): { inner: string; end: number } | undefined {
	const leading = html.match(/^\s*/)?.[0].length ?? 0;
	if (html[leading] !== "<") return undefined;
	const el = readElement(html, leading);
	if (!hasClass(el.attrs.class, className)) return undefined;
	return { inner: el.inner, end: el.end };
}

function hasClass(className: string | undefined, name: string) {
	return className?.split(/\s+/).includes(name) === true;
}

function domProps(attrs: Record<string, string>) {
	const props: Record<string, unknown> = {};
	for (const [name, value] of Object.entries(attrs)) {
		if (name === "class") props.className = value;
		else if (name === "style") props.style = cssToStyle(value);
		else if (name === "tabindex") props.tabIndex = Number(value);
		else if (name.startsWith("data-") || name.startsWith("aria-")) {
			props[name] = value;
		}
	}
	return props;
}

function cssToStyle(css: string): CSSProperties {
	const style: Record<string, string> = {};
	for (const decl of css.split(";")) {
		const idx = decl.indexOf(":");
		if (idx === -1) continue;
		const prop = decl.slice(0, idx).trim();
		const value = decl.slice(idx + 1).trim();
		if (!prop) continue;
		style[prop.startsWith("--") ? prop : camelCase(prop)] = value;
	}
	return style as CSSProperties;
}

function camelCase(prop: string) {
	return prop.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

function decodeEntities(value: string) {
	return value
		.replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
			String.fromCodePoint(Number.parseInt(hex, 16)),
		)
		.replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
		.replace(/&nbsp;/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, "&");
}
