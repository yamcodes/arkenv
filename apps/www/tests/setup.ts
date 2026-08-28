import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, vi } from "vitest";

expect.extend(matchers);

// Mock ResizeObserver for next-video/background-video dependency
class ResizeObserverMock {
	observe() {
		// Mock implementation
	}
	unobserve() {
		// Mock implementation
	}
	disconnect() {
		// Mock implementation
	}
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

// Mock matchMedia for next-video/background-video dependency
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

Object.defineProperty(globalThis, "matchMedia", {
	writable: true,
	value: window.matchMedia,
});

// Polyfill for Pointer Events API (required by Radix UI components)
// JSDOM doesn't implement hasPointerCapture and releasePointerCapture
if (!Element.prototype.hasPointerCapture) {
	Element.prototype.hasPointerCapture = () => false;
}

if (!Element.prototype.releasePointerCapture) {
	Element.prototype.releasePointerCapture = () => {
		// Mock implementation
	};
}

afterEach(() => {
	cleanup();
});
