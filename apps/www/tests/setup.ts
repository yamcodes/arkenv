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
const SUPPRESSION_TOKEN = "Could not parse CSS stylesheet";
const shouldSuppress = (value: unknown): boolean => {
	return typeof value === "string" && value.includes(SUPPRESSION_TOKEN);
};

const interceptConsoleMethod = (method: "error" | "warn") => {
	// biome-ignore lint/suspicious/noConsole: Mocking console methods for test setup
	const original = console[method];
	console[method] = (...args: unknown[]) => {
		if (args.some(shouldSuppress)) {
			return;
		}
		original.apply(console, args as Parameters<typeof original>);
	};
};

interceptConsoleMethod("error");
interceptConsoleMethod("warn");

const originalStderrWrite = process.stderr.write;
// JSDOM writes CSS parsing errors directly to stderr, so we need to intercept that too
process.stderr.write = function processWriteInterceptor(
	chunk: string | Uint8Array,
	encodingOrCb?: BufferEncoding | ((err?: Error | null) => void),
	cb?: (err?: Error | null) => void,
) {
	const message = typeof chunk === "string" ? chunk : chunk.toString();
	if (shouldSuppress(message)) {
		return true;
	}
	return originalStderrWrite.call(
		process.stderr,
		chunk,
		encodingOrCb as never,
		cb as never,
	);
};

afterEach(() => {
	cleanup();
});
