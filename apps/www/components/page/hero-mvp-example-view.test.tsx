import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeroMvpExampleView } from "./hero-mvp-example-view";
import {
	HERO_MVP_HOSTS,
	HERO_MVP_VALIDATORS,
	type HeroMvpHostId,
	type HeroMvpValidatorId,
	heroMvpSnippet,
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
						: validator === "valibot"
							? "v.pipe(v.string(), v.url())"
							: "@arkenv/standard";
	return `<pre class="shiki twoslash"><code>${token}</code></pre>`;
}

const examples = HERO_MVP_HOSTS.flatMap((host) =>
	HERO_MVP_VALIDATORS.map((validator) => ({
		host: host.id,
		validator: validator.id,
		importLine:
			host.id === "next"
				? "@/.arkenv"
				: validator.id === "arktype"
					? "@arkenv/core"
					: validator.id === "valibot"
						? "@arkenv/standard/valibot"
						: "@arkenv/standard",
		html: htmlFor(host.id, validator.id),
		code: heroMvpSnippet(host.id, validator.id).code,
	})),
);

function renderView() {
	return render(
		<HeroPlaygroundProvider>
			<HeroMvpExampleView examples={examples} />
		</HeroPlaygroundProvider>,
	);
}


function mockScrollOverflow(overflow: boolean) {
	const scrollTop = { value: 0, writable: true, configurable: true };
	vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
	vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
		overflow ? 240 : 100,
	);
	Object.defineProperty(HTMLElement.prototype, "scrollTop", scrollTop);
}

afterEach(() => {
	vi.restoreAllMocks();
});

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
		expect(screen.getByRole("tab", { name: "Zod" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Valibot" })).toBeInTheDocument();
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

		expect(screen.getByRole("tabpanel")).not.toHaveAttribute("data-overflow");

		await user.click(screen.getByRole("tab", { name: "Zod" }));
		expect(screen.getByRole("tabpanel")).not.toHaveAttribute("data-overflow");
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).toHaveTextContent("z.url()");
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).not.toHaveTextContent("VITE_API_URL");

		mockScrollOverflow(true);
		await user.click(screen.getByRole("tab", { name: "Valibot" }));
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).toHaveTextContent("v.pipe(v.string(), v.url())");
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).not.toHaveTextContent("VITE_API_URL");
		expect(screen.getByRole("tabpanel")).toHaveAttribute(
			"data-overflow",
			"true",
		);
		expect(screen.getByRole("tabpanel")).toHaveAttribute(
			"data-fade-bottom",
			"true",
		);
		expect(screen.getByRole("tabpanel")).not.toHaveAttribute("data-fade-top");
	});

	it("copies the visible tab source", async () => {
		const user = userEvent.setup();
		renderView();

		await user.click(screen.getByRole("button", { name: "Copy" }));
		expect(await navigator.clipboard.readText()).toBe(
			heroMvpSnippet("vanilla", "arktype").code,
		);

		await user.click(screen.getByRole("tab", { name: "Zod" }));
		await user.click(screen.getByRole("button", { name: /^Copy$|^Copied$/ }));
		expect(await navigator.clipboard.readText()).toBe(
			heroMvpSnippet("vanilla", "zod").code,
		);

		await user.click(screen.getByRole("tab", { name: "Valibot" }));
		await user.click(screen.getByRole("button", { name: /^Copy$|^Copied$/ }));
		expect(await navigator.clipboard.readText()).toBe(
			heroMvpSnippet("vanilla", "valibot").code,
		);
	});
});
