import { describe, expect, it } from "vitest";
import {
	extractEnvHoverHtml,
	extractTwoslashHoverHtml,
} from "./extract-hero-env-hover";

const fixture = [
	'<pre class="shiki twoslash">',
	'<span class="twoslash-hover">',
	'<span class="twoslash-popup-container">',
	'<code class="twoslash-popup-code">function arkenv</code>',
	"</span>",
	"<span>arkenv</span>",
	"</span>",
	'<span class="twoslash-hover">',
	'<span class="twoslash-popup-container">',
	'<code class="twoslash-popup-code">',
	'<span style="--shiki-dark:#FF7B72">const</span> env',
	"</code>",
	"</span>",
	"<span>env</span>",
	"</span>",
	"</pre>",
].join("");

describe("extractTwoslashHoverHtml", () => {
	it("returns the themed popup for the env token", () => {
		const html = extractTwoslashHoverHtml(fixture, "env");
		expect(html).toContain("twoslash-popup-code");
		expect(html).toContain("--shiki-dark");
		expect(html).toContain("const");
		expect(html).not.toContain("function arkenv");
	});

	it("throws when env is missing", () => {
		expect(() => extractEnvHoverHtml("<pre>no hover</pre>")).toThrow(
			/no hover for env/,
		);
	});
});
