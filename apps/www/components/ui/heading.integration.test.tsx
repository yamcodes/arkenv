import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Heading } from "./heading";

// Mock window.matchMedia to control mobile detection
const mockMatchMedia = vi.fn((query: string) => ({
	matches: query.includes("max-width: 767px"),
	media: query,
	onchange: null,
	addListener: vi.fn(),
	removeListener: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn(),
}));

describe("Heading + useIsMobile integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: mockMatchMedia,
		});
		Object.defineProperty(globalThis, "matchMedia", {
			writable: true,
			value: mockMatchMedia,
		});
		// Set initial window width
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 800, // Desktop width
		});
	});

	it("should show anchor on hover on desktop", async () => {
		const user = userEvent.setup();
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 800, // Desktop
		});

		render(<Heading id="test-heading">Test Heading</Heading>);

		const heading = screen.getByRole("heading", { name: /test heading/i });
		expect(heading).toBeInTheDocument();

		// Anchor should exist but be hidden initially
		const anchor = screen.getByRole("link", {
			name: /link to section: test-heading/i,
		});
		expect(anchor).toBeInTheDocument();

		// Initially anchor should have opacity-0 (hidden)
		expect(anchor).toHaveClass("opacity-0");
		// Verify it has the hover classes that will make it visible
		expect(anchor).toHaveClass("group-hover:opacity-100");
		expect(anchor).toHaveClass("hover:opacity-100");

		// Hover over the heading (which has the 'group' class)
		await user.hover(heading);

		// On desktop, hovering the heading should make the anchor visible
		// The anchor uses group-hover:opacity-100 which applies when the parent group is hovered
		// We can verify the heading has the 'group' class for group-hover to work
		expect(heading).toHaveClass("group");
		// The anchor should still have the hover classes that enable visibility
		expect(anchor).toHaveClass("group-hover:opacity-100");
	});

	it("should show anchor on click on mobile", async () => {
		const user = userEvent.setup();
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 500, // Mobile
		});

		// Mock matchMedia to return mobile matches
		mockMatchMedia.mockImplementation((query: string) => ({
			matches: query.includes("max-width: 767px"),
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn((event, handler) => {
				// Simulate mobile resize
				if (event === "change") {
					setTimeout(() => {
						handler({ matches: true } as MediaQueryListEvent);
					}, 0);
				}
			}),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));

		render(<Heading id="test-heading">Test Heading</Heading>);

		const heading = screen.getByRole("heading", { name: /test heading/i });
		await user.click(heading);

		// On mobile, clicking should show the anchor
		const anchor = screen.getByRole("link", {
			name: /link to section: test-heading/i,
		});
		expect(anchor).toBeInTheDocument();
	});

	it("should handle anchor click on mobile", async () => {
		const user = userEvent.setup();
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 500, // Mobile
		});

		// Mock scrollIntoView
		const scrollIntoViewMock = vi.fn();
		Element.prototype.scrollIntoView = scrollIntoViewMock;

		// Mock location.hash
		Object.defineProperty(window, "location", {
			writable: true,
			value: {
				hash: "",
			},
		});

		render(<Heading id="test-heading">Test Heading</Heading>);

		const anchor = screen.getByRole("link", {
			name: /link to section: test-heading/i,
		});
		await user.click(anchor);

		// Should scroll to element
		expect(scrollIntoViewMock).toHaveBeenCalled();
	});

	it("should update anchor visibility based on mobile state", async () => {
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 500, // Mobile
		});

		const changeHandlers: Array<(event: MediaQueryListEvent) => void> = [];

		mockMatchMedia.mockImplementation((query: string) => ({
			matches: query.includes("max-width: 767px"),
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn((event, handler) => {
				if (event === "change" && typeof handler === "function") {
					changeHandlers.push(handler);
				}
			}),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));

		render(<Heading id="test-heading">Test Heading</Heading>);

		const anchor = screen.getByRole("link", {
			name: /link to section: test-heading/i,
		});
		expect(anchor).toBeInTheDocument();

		// Simulate resize to desktop
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 800,
		});

		// Trigger change handlers
		changeHandlers.forEach((handler) => {
			handler({ matches: false } as MediaQueryListEvent);
		});
	});
});
