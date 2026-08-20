import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HeroMvpExampleView } from "./hero-mvp-example-view";
import {
	HERO_MVP_HOSTS,
	HERO_MVP_VALIDATORS,
	type HeroMvpHostId,
	type HeroMvpValidatorId,
} from "./hero-mvp-snippets";
import { HeroPlaygroundProvider } from "./hero-playground";

function htmlFor(host: HeroMvpHostId, validator: HeroMvpValidatorId) {
	const token =
		host === "vanilla" && validator === "arktype"
			? "@arkenv/core"
			: host === "vite"
				? "VITE_API_URL"
				: host === "next"
					? "NEXT_PUBLIC_API_URL"
					: validator === "zod"
						? "z.url()"
						: "v.pipe";
	return `<pre class="shiki twoslash"><code>${token}</code></pre>`;
}

const examples = HERO_MVP_HOSTS.flatMap((host) =>
	HERO_MVP_VALIDATORS.map((validator) => ({
		host: host.id,
		validator: validator.id,
		importLine:
			host.id === "next"
				? "@/generated/env.gen"
				: validator.id === "arktype"
					? "@arkenv/core"
					: "@arkenv/standard",
		html: htmlFor(host.id, validator.id),
	})),
);

function renderView() {
	return render(
		<HeroPlaygroundProvider>
			<HeroMvpExampleView examples={examples} />
		</HeroPlaygroundProvider>,
	);
}

describe("HeroMvpExampleView", () => {
	it("starts on ArkType with validator tabs and no host switcher", () => {
		renderView();

		expect(screen.getByText("./env.ts")).toBeVisible();
		expect(
			screen.queryByRole("button", { name: /Host:/ }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "ArkType" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(
			screen.getByRole("tab", { name: "ArkType" }).querySelector("svg"),
		).not.toBeNull();
		expect(
			screen.queryByRole("tab", { name: "Vanilla" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).toHaveTextContent("@arkenv/core");
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).not.toHaveTextContent("VITE_API_URL");
	});

	it("switches validator from tabs and keeps the vanilla snippet", async () => {
		const user = userEvent.setup();
		renderView();

		await user.click(screen.getByRole("tab", { name: "Zod" }));
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).toHaveTextContent("z.url()");
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).not.toHaveTextContent("VITE_API_URL");

		await user.click(screen.getByRole("tab", { name: "Valibot" }));
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).toHaveTextContent("v.pipe");
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).not.toHaveTextContent("NEXT_PUBLIC_API_URL");
	});
});
