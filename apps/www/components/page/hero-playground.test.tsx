import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroEnvHover } from "./hero-env-hover";
import { HeroMvpExampleView } from "./hero-mvp-example-view";
import {
	HERO_MVP_HOSTS,
	HERO_MVP_VALIDATORS,
	type HeroMvpHostId,
	type HeroMvpValidatorId,
} from "./hero-mvp-snippets";
import { HERO_FIRST_DWELL_MS, HeroNameCycle } from "./hero-name-cycle";
import { HeroPlaygroundProvider } from "./hero-playground";

function mockMatchMedia(matches: boolean) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn((query: string) => ({
			matches,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

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

function renderPlayground() {
	return render(
		<HeroPlaygroundProvider>
			<h1>
				<HeroNameCycle />
			</h1>
			<p>
				typed{" "}
				<HeroEnvHover
					hovers={examples.map((example) => ({
						host: example.host,
						validator: example.validator,
						html:
							example.validator === "zod"
								? "<span>z.url()</span>"
								: example.validator === "valibot"
									? "<span>v.pipe</span>"
									: "<span>DATABASE_URL PORT</span>",
					}))}
				/>{" "}
				object
			</p>
			<HeroMvpExampleView examples={examples} />
		</HeroPlaygroundProvider>,
	);
}

describe("hero playground sync", () => {
	beforeEach(() => {
		mockMatchMedia(false);
	});

	afterEach(() => {
		vi.useRealTimers();
		mockMatchMedia(false);
	});

	it("cycles the H1 and the active tab together", () => {
		vi.useFakeTimers();
		renderPlayground();

		expect(screen.getByRole("tab", { name: "ArkType" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).toHaveTextContent("@arkenv/core");

		act(() => {
			vi.advanceTimersByTime(HERO_FIRST_DWELL_MS);
		});

		expect(screen.getByText("Zod", { selector: "[data-pos]" })).toHaveAttribute(
			"data-pos",
			"current",
		);
		expect(screen.getByRole("tab", { name: "Zod" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).toHaveTextContent("z.url()");
	});

	it("stops cycling when the pointer enters the example", () => {
		vi.useFakeTimers();
		renderPlayground();

		const example = screen.getByRole("tabpanel").closest(".home-aurora__mvp");
		if (!example) throw new Error("missing example");
		fireEvent.pointerEnter(example);

		act(() => {
			vi.advanceTimersByTime(HERO_FIRST_DWELL_MS + 100);
		});

		expect(
			screen.getByText("ArkType", { selector: "[data-pos]" }),
		).toHaveAttribute("data-pos", "current");
		expect(screen.getByRole("tab", { name: "ArkType" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});

	it("jumps the H1 when the user picks a tab", async () => {
		const user = userEvent.setup();
		renderPlayground();

		await user.click(screen.getByRole("tab", { name: "Valibot" }));

		expect(
			screen.getByText("Valibot", { selector: "[data-pos]" }),
		).toHaveAttribute("data-pos", "current");
		expect(screen.getByRole("tab", { name: "Valibot" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(
			screen.getByRole("tabpanel").querySelector("[data-active='true']"),
		).toHaveTextContent("v.pipe");
	});

	it("updates the slogan env hover when the validator changes", async () => {
		const user = userEvent.setup();
		renderPlayground();

		await user.click(screen.getByRole("tab", { name: "Zod" }));
		await user.hover(
			screen.getByRole("button", { name: "Example type of env" }),
		);

		expect(await screen.findByRole("dialog")).toHaveTextContent("z.url()");
		expect(screen.queryByText(/VITE_API_URL/)).not.toBeInTheDocument();
	});
});
