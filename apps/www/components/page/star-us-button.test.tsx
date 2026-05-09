import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StarUsButton } from "./star-us-button";

// Mock fetch to avoid real API calls
global.fetch = vi.fn();

describe("StarUsButton", () => {
	it("renders star button with correct text", () => {
		render(<StarUsButton />);

		const buttons = screen.getAllByText("Star us on GitHub");
		expect(buttons).toHaveLength(1); // Mobile only (desktop is in header)
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

	it("renders mobile version only", () => {
		render(<StarUsButton />);

		// Should have one button with the same text (mobile version)
		const buttons = screen.getAllByText("Star us on GitHub");
		expect(buttons).toHaveLength(1);
	});

	it("provides accessible links", () => {
		render(<StarUsButton />);

		const links = screen.getAllByRole("link");
		expect(links).toHaveLength(1);

		links.forEach((link) => {
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		});
	});
});
