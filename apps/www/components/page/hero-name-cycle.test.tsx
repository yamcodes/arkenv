import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	HERO_CYCLE_MS,
	HERO_FIRST_DWELL_MS,
	HERO_VALIDATOR_NAMES,
	HeroNameCycle,
} from "./hero-name-cycle";
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

function renderCycle() {
	return render(
		<HeroPlaygroundProvider>
			<HeroNameCycle />
		</HeroPlaygroundProvider>,
	);
}

describe("HeroNameCycle", () => {
	beforeEach(() => {
		mockMatchMedia(false);
	});

	afterEach(() => {
		vi.useRealTimers();
		mockMatchMedia(false);
	});

	it("exposes the current validator name, not the full list", () => {
		renderCycle();

		expect(
			screen.getByText("ArkType", { selector: "[data-pos='current']" }),
		).toBeInTheDocument();
		expect(
			screen.queryByText("ArkType, Zod, and Valibot"),
		).not.toBeInTheDocument();
	});

	it("starts on ArkType and cycles through each name", () => {
		vi.useFakeTimers();
		renderCycle();

		expect(
			screen.getByText("ArkType", { selector: "[data-pos]" }),
		).toHaveAttribute("data-pos", "current");

		act(() => {
			vi.advanceTimersByTime(HERO_FIRST_DWELL_MS - 1);
		});
		expect(
			screen.getByText("ArkType", { selector: "[data-pos]" }),
		).toHaveAttribute("data-pos", "current");

		for (const name of HERO_VALIDATOR_NAMES.slice(1)) {
			act(() => {
				vi.advanceTimersByTime(name === "Zod" ? 1 : HERO_CYCLE_MS);
			});
			expect(
				screen.getByText(name, { selector: "[data-pos]" }),
			).toHaveAttribute("data-pos", "current");
		}
	});

	it("stays on ArkType when the user prefers reduced motion", () => {
		vi.useFakeTimers();
		mockMatchMedia(true);
		renderCycle();

		act(() => {
			vi.advanceTimersByTime(7800);
		});

		expect(
			screen.getByText("ArkType", { selector: "[data-pos]" }),
		).toHaveAttribute("data-pos", "current");
		expect(screen.queryByText("Zod", { selector: "[data-pos]" })).toBeNull();
	});
});
