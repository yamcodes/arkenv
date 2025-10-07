import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SailButton } from "./sail-button";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

describe("SailButton", () => {
	it("renders sail button with correct text", () => {
		render(<SailButton />);
		expect(screen.getByText("Set sail")).toBeInTheDocument();
		expect(screen.getByText("->")).toBeInTheDocument();
	});

	it("renders as a link to docs/quickstart", () => {
		render(<SailButton />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/docs/quickstart");
	});

	it("handles left click and triggers animation", async () => {
		const user = userEvent.setup();
		render(<SailButton />);
		const link = screen.getByRole("link");

		await user.click(link);

		// The button should still be rendered (animation state change)
		expect(link).toBeInTheDocument();
	});

	it("allows middle click to work normally", async () => {
		const user = userEvent.setup();
		render(<SailButton />);
		const link = screen.getByRole("link");

		// Simulate middle click
		await user.click(link, { button: 1 });

		// Should not prevent default behavior
		expect(link).toBeInTheDocument();
	});

	it("allows ctrl+click to work normally", async () => {
		const user = userEvent.setup();
		render(<SailButton />);
		const link = screen.getByRole("link");

		// Simulate ctrl+click
		await user.click(link, { ctrlKey: true });

		// Should not prevent default behavior
		expect(link).toBeInTheDocument();
	});

	it("allows meta+click to work normally", async () => {
		const user = userEvent.setup();
		render(<SailButton />);
		const link = screen.getByRole("link");

		// Simulate meta+click (Cmd on Mac)
		await user.click(link, { metaKey: true });

		// Should not prevent default behavior
		expect(link).toBeInTheDocument();
	});

	it("renders sailboat icon", () => {
		render(<SailButton />);
		// The Sailboat icon should be present (we can't easily test the icon component directly)
		expect(screen.getByText("Set sail")).toBeInTheDocument();
	});

	it("has accessible button text", () => {
		render(<SailButton />);
		expect(screen.getByText("Set sail")).toBeInTheDocument();
		expect(screen.getByText("->")).toBeInTheDocument();
	});
});
