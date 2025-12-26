import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuickstartButton } from "./quickstart-button";

describe("QuickstartButton", () => {
	it("renders quickstart button with correct text", () => {
		render(<QuickstartButton />);
		expect(screen.getByText("Quickstart")).toBeInTheDocument();
	});

	it("renders as a link to docs/quickstart", () => {
		render(<QuickstartButton />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/docs/arkenv/quickstart");
	});
});
