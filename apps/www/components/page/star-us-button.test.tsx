import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StarUsButton } from "./star-us-button";

// Mock fetch to avoid real API calls
global.fetch = vi.fn();

describe("StarUsButton", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("renders star button with correct text", () => {
		render(<StarUsButton />);

		const buttons = screen.getAllByText("Star us on GitHub!");
		expect(buttons).toHaveLength(2); // One for mobile, one for desktop
	});

	it("renders GitHub link with correct href", () => {
		render(<StarUsButton />);

		const links = screen.getAllByRole("link");
		links.forEach((link) => {
			expect(link).toHaveAttribute("href");
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		});
	});

	it("accepts custom className", () => {
		const { container } = render(<StarUsButton className="custom-class" />);

		const customElements = container.querySelectorAll(".custom-class");
		expect(customElements.length).toBeGreaterThan(0);
	});

	it("has correct responsive classes", () => {
		const { container } = render(<StarUsButton />);

		// Check for mobile-only div
		const mobileDiv = container.querySelector(".sm\\:hidden");
		expect(mobileDiv).toBeInTheDocument();

		// Check for desktop-only div
		const desktopDiv = container.querySelector(".hidden.sm\\:block");
		expect(desktopDiv).toBeInTheDocument();
	});
});
