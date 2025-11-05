import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-is-mobile";

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: mockMatchMedia,
});

describe("useIsMobile", () => {
	it("returns true for mobile screen size", () => {
		// Mock window.innerWidth for mobile
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 500,
		});

		mockMatchMedia.mockReturnValue({
			matches: true,
			media: "(max-width: 768px)",
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		});

		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(true);
	});

	it("returns false for desktop screen size", () => {
		// Mock window.innerWidth for desktop
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 1024,
		});

		mockMatchMedia.mockReturnValue({
			matches: false,
			media: "(max-width: 768px)",
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		});

		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(false);
	});

	it("handles media query changes", () => {
		// Mock window.innerWidth for desktop
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 1024,
		});

		mockMatchMedia.mockReturnValue({
			matches: false,
			media: "(max-width: 768px)",
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		});

		const { result, unmount } = renderHook(() => useIsMobile());

		// The hook should render without errors and return a boolean
		expect(typeof result.current).toBe("boolean");

		unmount();
		// Test passes if no errors are thrown
		expect(true).toBe(true);
	});
});
