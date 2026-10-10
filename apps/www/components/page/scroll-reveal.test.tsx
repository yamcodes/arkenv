import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollReveal } from "./scroll-reveal";

class ImmediateObserver implements IntersectionObserver {
	readonly root = null;
	readonly rootMargin = "";
	readonly thresholds: readonly number[] = [];
	private readonly callback: IntersectionObserverCallback;

	constructor(callback: IntersectionObserverCallback) {
		this.callback = callback;
	}

	observe(target: Element) {
		this.callback(
			[{ isIntersecting: true, target } as IntersectionObserverEntry],
			this,
		);
	}

	unobserve() {}
	disconnect() {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

const REVEAL_CSS = `
	[data-reveal].reveal-shown {
		transition: opacity 800ms ease, transform 800ms ease, filter 700ms ease;
		transition-delay: 80ms;
	}
`;

function installObserver() {
	vi.stubGlobal("IntersectionObserver", ImmediateObserver);
	window.IntersectionObserver =
		ImmediateObserver as unknown as typeof IntersectionObserver;
}

function matchMedia(matches: boolean) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		configurable: true,
		value: vi.fn(() => ({
			matches,
			media: "(prefers-reduced-motion: reduce)",
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

describe("ScrollReveal", () => {
	beforeEach(() => {
		installObserver();
		matchMedia(false);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
		matchMedia(false);
	});

	it("leaves content alone when the user prefers reduced motion", () => {
		matchMedia(true);

		render(
			<div>
				<div data-reveal>Copy</div>
				<ScrollReveal />
			</div>,
		);

		const el = document.querySelector("[data-reveal]");
		expect(el).not.toHaveClass("reveal-hidden");
		expect(el).not.toHaveClass("reveal-shown");
		expect(el).not.toHaveClass("reveal-settled");
	});

	it("keeps the reveal unsettled until the opacity transition ends", () => {
		render(
			<div>
				<style>{REVEAL_CSS}</style>
				<div data-reveal>
					<a href="/docs">Read the docs</a>
				</div>
				<ScrollReveal />
			</div>,
		);

		const el = document.querySelector("[data-reveal]");
		expect(el).toHaveClass("reveal-shown");
		expect(el).not.toHaveClass("reveal-hidden");
		expect(el).not.toHaveClass("reveal-settled");

		const link = el?.querySelector("a");
		act(() => {
			link?.dispatchEvent(
				new TransitionEvent("transitionend", {
					propertyName: "opacity",
					bubbles: true,
				}),
			);
		});
		expect(el).not.toHaveClass("reveal-settled");

		act(() => {
			el?.dispatchEvent(
				new TransitionEvent("transitionend", {
					propertyName: "transform",
					bubbles: true,
				}),
			);
		});
		expect(el).not.toHaveClass("reveal-settled");

		act(() => {
			el?.dispatchEvent(
				new TransitionEvent("transitionend", {
					propertyName: "opacity",
					bubbles: true,
				}),
			);
		});
		expect(el).toHaveClass("reveal-settled");
	});

	it("settles from the fallback timer when transitionend never fires", () => {
		vi.useFakeTimers();
		const realGetComputedStyle = window.getComputedStyle.bind(window);
		vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
			const style = realGetComputedStyle(element);
			if (
				!(element instanceof Element) ||
				!element.hasAttribute("data-reveal")
			) {
				return style;
			}
			return new Proxy(style, {
				get(target, prop, receiver) {
					if (prop === "transitionDuration") return "800ms, 800ms, 700ms";
					if (prop === "transitionDelay") return "80ms, 80ms, 80ms";
					const value = Reflect.get(target, prop, receiver);
					return typeof value === "function" ? value.bind(target) : value;
				},
			});
		});

		render(
			<div>
				<div data-reveal />
				<ScrollReveal />
			</div>,
		);

		const el = document.querySelector("[data-reveal]");
		expect(el).toHaveClass("reveal-shown");
		expect(el).not.toHaveClass("reveal-settled");

		act(() => {
			vi.advanceTimersByTime(929);
		});
		expect(el).not.toHaveClass("reveal-settled");

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(el).toHaveClass("reveal-settled");
	});
});
