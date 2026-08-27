import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
				? "@/generated/env.gen"
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

describe("HeroMvpExampleView", () => {
	let writeText: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(window.navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});
	});

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
		).toHaveTextContent("v.pipe(v.string(), v.url())");
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).not.toHaveTextContent("VITE_API_URL");
	});

	it("copies the visible tab source", async () => {
		const user = userEvent.setup();
		renderView();

		fireEvent.click(screen.getByRole("button", { name: "Copy" }));
		await waitFor(() => {
			expect(writeText).toHaveBeenCalledWith(
				heroMvpSnippet("vanilla", "arktype").code,
			);
		});

		await user.click(screen.getByRole("tab", { name: "Zod" }));
		fireEvent.click(screen.getByRole("button", { name: /^Copy$|^Copied$/ }));
		await waitFor(() => {
			expect(writeText).toHaveBeenLastCalledWith(
				heroMvpSnippet("vanilla", "zod").code,
			);
		});

		await user.click(screen.getByRole("tab", { name: "Valibot" }));
		fireEvent.click(screen.getByRole("button", { name: /^Copy$|^Copied$/ }));
		await waitFor(() => {
			expect(writeText).toHaveBeenLastCalledWith(
				heroMvpSnippet("vanilla", "valibot").code,
			);
		});
	});
});
