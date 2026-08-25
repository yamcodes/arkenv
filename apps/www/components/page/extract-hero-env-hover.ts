/**
 * Pull the Twoslash hover body for a token out of Shiki HTML.
 * Inner HTML is already themed — reuse it so slogan and snippet popups match.
 */
export function extractTwoslashHoverHtml(
	html: string,
	token: string,
): string | undefined {
	const open = /<span(?=[\s>])/g;
	let match = open.exec(html);
	while (match) {
		const start = match.index;
		const gt = html.indexOf(">", start);
		if (gt === -1) break;
		const opening = html.slice(start, gt + 1);
		if (/\btwoslash-hover\b/.test(opening)) {
			const element = extractElement(html, start, "span");
			const popup = firstChildByClass(
				element.inner,
				"twoslash-popup-container",
			);
			if (
				popup &&
				textContent(element.inner.slice(popup.end)).trim() === token
			) {
				return popup.inner;
			}
			open.lastIndex = element.end;
		}
		match = open.exec(html);
	}
	return undefined;
}

export function extractEnvHoverHtml(html: string): string {
	const inner = extractTwoslashHoverHtml(html, "env");
	if (!inner) {
		throw new Error("Twoslash HTML has no hover for env");
	}
	return inner;
}

function extractElement(
	html: string,
	start: number,
	tag: string,
): { end: number; inner: string } {
	const gt = html.indexOf(">", start);
	if (gt === -1) {
		throw new Error(`unterminated <${tag}>`);
	}
	if (html[gt - 1] === "/") {
		return { end: gt + 1, inner: "" };
	}
	const openRe = new RegExp(`<${tag}(?=[\\s>/])`, "g");
	const closeRe = new RegExp(`</${tag}>`, "g");
	let depth = 1;
	let i = gt + 1;
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
				return {
					end: i,
					inner: html.slice(gt + 1, nextClose.index),
				};
			}
		}
	}
	throw new Error(`unclosed <${tag}>`);
}

function firstChildByClass(
	html: string,
	className: string,
): { end: number; inner: string } | undefined {
	const leading = html.match(/^\s*/)?.[0].length ?? 0;
	const needle = new RegExp(`<([a-zA-Z][\\w:-]*)(?=[^>]*\\b${className}\\b)`);
	const match = needle.exec(html.slice(leading));
	if (!match || match.index !== 0) return undefined;
	const tag = match[1];
	if (!tag) return undefined;
	return extractElement(html, leading, tag);
}

function textContent(html: string): string {
	return html
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
}
