import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HeroTwoslashHtml } from "./hero-twoslash-html";

const urlHoverHtml = [
	'<pre class="shiki twoslash"><code><span class="line">',
	'<span class="twoslash-hover">',
	'<span class="twoslash-popup-container">',
	'<code class="twoslash-popup-code">',
	'<span style="--shiki-dark:#FF7B72">function</span> ',
	'<span style="--shiki-dark:#D2A8FF">url</span>',
	"<span>(</span>",
	'<span style="--shiki-dark:#FFA657">params</span>',
	"<span>?:</span> ",
	'<span style="--shiki-dark:#79C0FF">string</span>',
	"</code>",
	"</span>",
	"<span>url</span>",
	"</span>",
	"</span></code></pre>",
].join("");

describe("HeroTwoslashHtml", () => {
	it("opens a docs Twoslash popover for a hovered token", async () => {
		const user = userEvent.setup();
		render(<HeroTwoslashHtml html={urlHoverHtml} active />);

		await user.hover(screen.getByRole("button", { name: "url" }));

		const popup = await screen.findByRole("dialog");
		expect(popup).toHaveClass("fd-twoslash-popover");
		expect(popup.closest("pre")).toBeNull();
		expect(popup).toHaveTextContent("function url(params?: string");
	});

	it("renders type punctuation instead of HTML entities", async () => {
		const user = userEvent.setup();
		const html = [
			'<pre class="shiki twoslash"><code><span class="line">',
			'<span class="twoslash-hover">',
			'<span class="twoslash-popup-container">',
			'<code class="twoslash-popup-code">',
			"<span>function</span> <span>toJsonSchema</span>",
			"<span>(</span><span>schema</span><span>: </span>",
			"<span>BaseSchema</span>&#x3C;<span>unknown</span>&#x3E;",
			"</code>",
			"</span>",
			"<span>toJsonSchema</span>",
			"</span>",
			"</span></code></pre>",
		].join("");
		render(<HeroTwoslashHtml html={html} active />);

		await user.hover(screen.getByRole("button", { name: "toJsonSchema" }));

		const popup = await screen.findByRole("dialog");
		expect(popup).toHaveTextContent(
			"function toJsonSchema(schema: BaseSchema<unknown>",
		);
		expect(popup.textContent).not.toContain("&#x3C;");
	});

	it("does not mount popovers on inactive stacked panes", () => {
		render(<HeroTwoslashHtml html={urlHoverHtml} active={false} />);

		expect(
			screen.queryByRole("button", { name: "url" }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(document.querySelector(".twoslash-hover")).not.toBeNull();
	});
});
