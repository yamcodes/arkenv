import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BringYourOwnValidatorView } from "./bring-your-own-validator-view";

describe("BringYourOwnValidatorView", () => {
	it("shows one mixed snippet with no validator tabs", () => {
		render(
			<BringYourOwnValidatorView html='<pre class="shiki twoslash"><code>z.url()</code></pre>' />,
		);

		expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
		expect(screen.queryByRole("tab")).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
			"Keep your existing validator.",
		);
		expect(
			screen.getByText(/mix and match/i).closest("p"),
		).toHaveTextContent(
			"Pass the ArkType, Zod, Valibot, or any Standard Schema you already have, or mix and match for incremental migration.",
		);
		expect(screen.getByRole("link", { name: "Standard Schema" })).toHaveAttribute(
			"href",
			"/docs/core-concepts/standard-schema",
		);
	});
});
