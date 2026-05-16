import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "~/components/ui/toaster";
import { CLICommand } from "./cli-command";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
}));

describe("CLICommand", () => {
	beforeEach(() => {
		// Mock clipboard API
		Object.defineProperty(navigator, "clipboard", {
			writable: true,
			configurable: true,
			value: {
				writeText: vi.fn().mockResolvedValue(undefined),
			},
		});
	});

	afterEach(() => {
		// @ts-ignore
		delete navigator.clipboard;
	});

	it("should render with syntax highlighting spans", () => {
		render(<CLICommand />);
		expect(screen.getByText("npx")).toBeInTheDocument();
		expect(screen.getByText("@arkenv/cli")).toBeInTheDocument();
		expect(screen.getByText("@latest")).toBeInTheDocument();
		expect(screen.getByText("init")).toBeInTheDocument();
	});

	it("should copy command when clicking the container", async () => {
		const user = userEvent.setup();
		render(
			<>
				<CLICommand />
				<Toaster />
			</>,
		);

		const container = screen.getByRole("button", { name: /copy install command/i });
		await user.click(container);

		// Verify copy happened by checking for success markers:
		// 1. Toast appears
		// 2. Button aria-label changes to "Copied"
		
		await waitFor(() => {
			expect(
				screen.getByText(/command copied to clipboard/i),
			).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByLabelText("Copied")).toBeInTheDocument();
		});
	});

	it("should copy command when pressing Enter", async () => {
		const user = userEvent.setup();
		render(
			<>
				<CLICommand />
				<Toaster />
			</>,
		);

		const container = screen.getByRole("button", { name: /copy install command/i });
		container.focus();
		await user.keyboard("{Enter}");

		await waitFor(() => {
			expect(
				screen.getByText(/command copied to clipboard/i),
			).toBeInTheDocument();
		});
	});
});
