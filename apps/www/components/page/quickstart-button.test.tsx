import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SailButton } from "./sail-button";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

describe("SailButton", () => {
	it("renders quickstart button with correct text", () => {
		render(<SailButton />);
		expect(screen.getByText("Quickstart")).toBeInTheDocument();
	});

	it("renders as a link to docs/quickstart", () => {
		render(<SailButton />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/docs/arkenv/quickstart");
	});

	it("has accessible button text", () => {
		render(<SailButton />);
		expect(screen.getByText("Quickstart")).toBeInTheDocument();
	});
});
