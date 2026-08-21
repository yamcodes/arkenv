import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	HERO_CYCLE_MS,
	HERO_DWELL_MS,
	HERO_FIRST_DWELL_MS,
	HERO_HEADLINE_NAMES,
	HeroNameCycle,
} from "./hero-name-cycle";

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

		expect(document.querySelector(".home-aurora__cycle-with")?.textContent).toBe(
			"with\u00a0",
		);
		expect(currentHeadline()?.textContent).toBe("ArkType");
		expect(
			`${document.querySelector(".home-aurora__cycle-with")?.textContent}${currentHeadline()?.textContent}`,
		).toBe("with\u00a0ArkType");
		expect(
			screen.queryByText("ArkType, Zod, and Valibot"),
		).not.toBeInTheDocument();
	});

	it("starts on ArkType and cycles through each name", () => {
		vi.useFakeTimers();
		render(<HeroNameCycle />);

		expect(currentHeadline()?.textContent).toBe("ArkType");
		expect(document.querySelector(".home-aurora__cycle-with")?.textContent).toBe(
			"with\u00a0",
		);

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

	it("pauses while the pointer is over the headline", () => {
		vi.useFakeTimers();
		render(
			<h1 id="home-hero">
				<HeroNameCycle />
			</h1>,
		);

		fireEvent.pointerEnter(document.getElementById("home-hero")!);
		act(() => {
			vi.advanceTimersByTime(HERO_FIRST_DWELL_MS + HERO_CYCLE_MS);
		});
		expect(currentHeadline()?.textContent).toBe("ArkType");

		fireEvent.pointerLeave(document.getElementById("home-hero")!);
		act(() => {
			vi.advanceTimersByTime(HERO_DWELL_MS);
		});
		expect(currentHeadline()?.textContent).toBe("Zod");
	});

	it("stays on ArkType when the user prefers reduced motion", () => {
		vi.useFakeTimers();
		mockMatchMedia(true);
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
