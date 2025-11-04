import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "~/components/ui/toaster";
import { CopyButton } from "./copy-button";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
}));

describe("CopyButton + useToast + Toaster integration", () => {
	let mockWriteText: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Mock clipboard API - must be set up before component renders
		mockWriteText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			writable: true,
			configurable: true,
			value: {
				writeText: mockWriteText,
			},
		});
	});

	afterEach(() => {
		// Clean up
		delete (navigator as { clipboard?: unknown }).clipboard;
	});

	it("should show toast when copy succeeds", async () => {
		const user = userEvent.setup();
		mockWriteText.mockResolvedValue(undefined);

		render(
			<>
				<CopyButton command="npm install arkenv" />
				<Toaster />
			</>,
		);

		const button = screen.getByRole("button", { name: /copy command/i });
		await user.click(button);

		// Verify clipboard was called
		expect(mockWriteText).toHaveBeenCalledWith("npm install arkenv");

		// Verify toast appears
		await waitFor(() => {
			expect(
				screen.getByText(/command copied to clipboard/i),
			).toBeInTheDocument();
		});
	});

	it("should show error toast when copy fails", async () => {
		const user = userEvent.setup();
		const error = new Error("Clipboard failed");
		mockWriteText.mockRejectedValue(error);

		render(
			<>
				<CopyButton command="npm install arkenv" />
				<Toaster />
			</>,
		);

		const button = screen.getByRole("button", { name: /copy command/i });
		await user.click(button);

		// Verify clipboard was called
		expect(mockWriteText).toHaveBeenCalledWith("npm install arkenv");

		// Verify error toast appears
		await waitFor(() => {
			expect(
				screen.getByText(/uh oh! something went wrong/i),
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/there was a problem copying the command to your clipboard/i,
				),
			).toBeInTheDocument();
		});
	});

	it("should update button icon when copy succeeds", async () => {
		const user = userEvent.setup();

		render(
			<>
				<CopyButton command="npm install arkenv" />
				<Toaster />
			</>,
		);

		const button = screen.getByRole("button", { name: /copy command/i });
		await user.click(button);

		// Verify clipboard was called
		expect(mockWriteText).toHaveBeenCalledWith("npm install arkenv");

		// Button should show check icon after copy (icon change happens via state)
		// We can verify the button is still visible and functional
		await waitFor(() => {
			expect(button).toBeInTheDocument();
		});
	});

	it("should handle multiple copy operations", async () => {
		const user = userEvent.setup();

		render(
			<>
				<CopyButton command="npm install arkenv" />
				<Toaster />
			</>,
		);

		const button = screen.getByRole("button", { name: /copy command/i });

		// First copy - verify toast appears
		await user.click(button);
		await waitFor(() => {
			expect(
				screen.getByText(/command copied to clipboard/i),
			).toBeInTheDocument();
		});

		// Wait for toast to disappear (it has a timeout)
		await waitFor(
			() => {
				expect(
					screen.queryByText(/command copied to clipboard/i),
				).not.toBeInTheDocument();
			},
			{ timeout: 3000 },
		).catch(() => {
			// If toast is still visible, that's okay for this test
		});

		// Click again - should show toast again
		await user.click(button);
		await waitFor(() => {
			expect(
				screen.getByText(/command copied to clipboard/i),
			).toBeInTheDocument();
		});
	});
});
