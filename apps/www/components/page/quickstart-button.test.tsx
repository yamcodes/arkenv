import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuickstartButton } from "./quickstart-button";

describe("QuickstartButton", () => {
	it("renders read the docs button with correct text", () => {
		render(<QuickstartButton />);
		expect(screen.getByText("Read the docs")).toBeInTheDocument();
	});

	it("renders as a link to docs", () => {
		render(<QuickstartButton />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/docs/getting-started");
		expect(link).toHaveClass("home-aurora__mobile-cta", "home-aurora__docs-cta");
	});
});
