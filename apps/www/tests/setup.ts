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

// Suppress JSDOM CSS parsing warnings for styled-jsx
// JSDOM tries to parse styled-jsx CSS and warns about syntax it doesn't understand
// This is harmless - the styles work fine in real browsers
// biome-ignore lint/suspicious/noConsole: Mocking console.error for test setup
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
	const message = String(args[0]);
	// Suppress "Could not parse CSS stylesheet" warnings from JSDOM
	if (message.includes("Could not parse CSS stylesheet")) {
		return;
	}
	originalConsoleError.call(console, ...args);
};

afterEach(() => {
	cleanup();
});
