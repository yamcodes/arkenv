import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	HERO_CYCLE_MS,
	HERO_DWELL_MS,
	HERO_FIRST_DWELL_MS,
	HERO_HEADLINE_NAMES,
	HERO_MOBILE_HEADLINE_NAMES,
	HeroNameCycle,
} from "./hero-name-cycle";

function mockMatchMedia(matchesMap: Record<string, boolean> | boolean = false) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn((query: string) => ({
			matches:
				typeof matchesMap === "boolean"
					? matchesMap
					: (matchesMap[query] ?? false),
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

function currentHeadline() {
	return document.querySelector("[data-pos='current']");
}

describe("HeroNameCycle", () => {
	beforeEach(() => {
		mockMatchMedia(false);
	});

	afterEach(() => {
		vi.useRealTimers();
		mockMatchMedia(false);
	});

	it("exposes the current name, not the full list", () => {
		render(<HeroNameCycle />);

		expect(
			document.querySelector(".home-aurora__cycle-with")?.textContent,
		).toBe("with\u00a0");
		expect(currentHeadline()?.textContent).toBe("ArkType");
		expect(
			`${document.querySelector(".home-aurora__cycle-with")?.textContent}${currentHeadline()?.textContent}`,
		).toBe("with\u00a0ArkType");
		expect(
			screen.queryByText("ArkType, Zod, and Valibot"),
		).not.toBeInTheDocument();
	});

	it("starts on ArkType and cycles through each name on desktop", () => {
		vi.useFakeTimers();
		render(<HeroNameCycle />);

		expect(currentHeadline()?.textContent).toBe("ArkType");
		expect(
			document.querySelector(".home-aurora__cycle-with")?.textContent,
		).toBe("with\u00a0");

		act(() => {
			vi.advanceTimersByTime(HERO_FIRST_DWELL_MS - 1);
		});
		expect(currentHeadline()?.textContent).toBe("ArkType");

		for (const name of HERO_HEADLINE_NAMES.slice(1)) {
			act(() => {
				vi.advanceTimersByTime(name === "Zod" ? 1 : HERO_CYCLE_MS);
			});
			expect(currentHeadline()?.textContent).toBe(name);
			expect(
				document.querySelector(".home-aurora__cycle-with")?.textContent,
			).toBe("with\u00a0");
		}

		act(() => {
			vi.advanceTimersByTime(HERO_CYCLE_MS);
		});
		expect(currentHeadline()?.textContent).toBe("ArkType");
	});

	it("omits Standard Schema on mobile", () => {
		vi.useFakeTimers();
		mockMatchMedia({ "(max-width: 39.99rem)": true });
		render(<HeroNameCycle />);

		expect(currentHeadline()?.textContent).toBe("ArkType");

		for (const name of HERO_MOBILE_HEADLINE_NAMES.slice(1)) {
			act(() => {
				vi.advanceTimersByTime(HERO_CYCLE_MS);
			});
			expect(currentHeadline()?.textContent).toBe(name);
		}

		act(() => {
			vi.advanceTimersByTime(HERO_CYCLE_MS);
		});
		expect(currentHeadline()?.textContent).toBe("ArkType");
		expect(screen.queryByText("Standard Schema")).toBeNull();
	});

	it("pauses while the pointer is over the cycling name", () => {
		vi.useFakeTimers();
		render(
			<h1 id="home-hero">
				Typesafe environment variables
				<HeroNameCycle />
			</h1>,
		);

		const cycle = document.querySelector(".home-aurora__cycle")!;
		fireEvent.pointerEnter(cycle);
		act(() => {
			vi.advanceTimersByTime(HERO_FIRST_DWELL_MS + HERO_CYCLE_MS);
		});
		expect(currentHeadline()?.textContent).toBe("ArkType");

		fireEvent.pointerLeave(cycle);
		act(() => {
			vi.advanceTimersByTime(HERO_DWELL_MS);
		});
		expect(currentHeadline()?.textContent).toBe("Zod");
	});

	it("does not pause when the pointer is over the rest of the headline", () => {
		vi.useFakeTimers();
		render(
			<h1 id="home-hero">
				Typesafe environment variables
				<HeroNameCycle />
			</h1>,
		);

		fireEvent.pointerEnter(document.getElementById("home-hero")!);
		act(() => {
			vi.advanceTimersByTime(HERO_FIRST_DWELL_MS);
		});
		expect(currentHeadline()?.textContent).toBe("Zod");
	});

	it("stays on ArkType when the user prefers reduced motion", () => {
		vi.useFakeTimers();
		mockMatchMedia({ "(prefers-reduced-motion: reduce)": true });
		render(<HeroNameCycle />);

		act(() => {
			vi.advanceTimersByTime(7800);
		});

		expect(currentHeadline()?.textContent).toBe("ArkType");
		expect(
			document.querySelector("[data-pos]:not([data-pos='current'])"),
		).toBeNull();
	});
});
