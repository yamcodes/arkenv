import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BringYourOwnValidatorView } from "./bring-your-own-validator-view";

describe("BringYourOwnValidatorView", () => {
	it("shows one mixed snippet with no validator tabs", () => {
		render(
			<BringYourOwnValidatorView
				html='<pre class="shiki twoslash"><code>z.url()</code></pre>'
				copyText={`export const env = arkenv({
  DEBUG: z.boolean(),
});`}
			/>,
		);

		expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
		expect(screen.queryByRole("tab")).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
			"Bring your own validator",
		);
		expect(screen.getByText(/mix and match/i).closest("p")).toHaveTextContent(
			"Use ArkType, Zod, Valibot, or any Standard Schema you already have. Mix and match for incremental migration.",
		);
		expect(
			screen.getByRole("link", { name: "Standard Schema" }),
		).toHaveAttribute(
			"href",
			"/docs/validators",
		);
		expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
		expect(document.querySelector(".home-aurora__mvp-shiki")).toBeTruthy();
	});
});
