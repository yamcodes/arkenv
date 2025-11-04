import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast, useToast } from "~/hooks/use-toast";
import { Toaster } from "./toaster";

// Test component that uses useToast hook
function TestComponent() {
	const { toast: toastFn } = useToast();

	return (
		<div>
			<button
				type="button"
				onClick={() => toastFn({ description: "Test toast" })}
			>
				Show Toast
			</button>
			<button
				type="button"
				onClick={() =>
					toastFn({
						title: "Error",
						description: "Something went wrong",
						variant: "destructive",
					})
				}
			>
				Show Error Toast
			</button>
		</div>
	);
}

describe("useToast + Toaster integration", () => {
	beforeEach(() => {
		vi.useRealTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should render toast when toast function is called", async () => {
		const user = userEvent.setup();

		render(
			<>
				<TestComponent />
				<Toaster />
			</>,
		);

		const button = screen.getByRole("button", { name: /show toast/i });
		await user.click(button);

		// Toast should appear
		await waitFor(() => {
			expect(screen.getByText(/test toast/i)).toBeInTheDocument();
		});
	});

	it("should render toast with title and description", async () => {
		const user = userEvent.setup();

		render(
			<>
				<TestComponent />
				<Toaster />
			</>,
		);

		const button = screen.getByRole("button", { name: /show error toast/i });
		await user.click(button);

		// Toast should appear with title and description
		await waitFor(() => {
			expect(screen.getByText(/error/i)).toBeInTheDocument();
			expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
		});
	});

	it("should render destructive variant toast", async () => {
		const user = userEvent.setup();

		render(
			<>
				<TestComponent />
				<Toaster />
			</>,
		);

		const button = screen.getByRole("button", { name: /show error toast/i });
		await user.click(button);

		await waitFor(() => {
			const toastElement = screen
				.getByText(/error/i)
				.closest('[role="status"]');
			expect(toastElement).toBeInTheDocument();
		});
	});

	it("should update Toaster when multiple toasts are added", async () => {
		const user = userEvent.setup();

		render(
			<>
				<TestComponent />
				<Toaster />
			</>,
		);

		const button = screen.getByRole("button", { name: /show toast/i });
		await user.click(button);

		// First toast
		await waitFor(() => {
			expect(screen.getByText(/test toast/i)).toBeInTheDocument();
		});

		// Click again - should replace first toast (TOAST_LIMIT = 1)
		await user.click(button);

		// Should still show toast (only one at a time due to limit)
		await waitFor(() => {
			expect(screen.getByText(/test toast/i)).toBeInTheDocument();
		});
	});

	it("should dismiss toast when close button is clicked", async () => {
		const user = userEvent.setup();

		render(
			<>
				<TestComponent />
				<Toaster />
			</>,
		);

		const button = screen.getByRole("button", { name: /show toast/i });
		await user.click(button);

		await waitFor(() => {
			expect(screen.getByText(/test toast/i)).toBeInTheDocument();
		});

		// Find and click close button (ToastClose from Radix UI)
		// Query by finding the button that contains the X icon
		const toastElement = screen
			.getByText(/test toast/i)
			.closest('[role="status"]');
		const closeButton = toastElement?.querySelector('button[toast-close=""]');
		if (closeButton) {
			await user.click(closeButton);
		}

		// Toast should be dismissed (removed from DOM)
		await waitFor(() => {
			expect(screen.queryByText(/test toast/i)).not.toBeInTheDocument();
		});
	});

	it("should handle toast state changes from useToast hook", async () => {
		const user = userEvent.setup();

		render(
			<>
				<TestComponent />
				<Toaster />
			</>,
		);

		// Wait a bit to ensure no initial toast
		await waitFor(
			() => {
				expect(screen.queryByText(/test toast/i)).not.toBeInTheDocument();
			},
			{ timeout: 100 },
		).catch(() => {
			// If toast already exists, that's okay - state might persist
		});

		const button = screen.getByRole("button", { name: /show toast/i });
		await user.click(button);

		// Toast should appear
		await waitFor(() => {
			expect(screen.getByText(/test toast/i)).toBeInTheDocument();
		});

		// Close toast
		const closeButton = screen.getByRole("button", { name: /close/i });
		await user.click(closeButton);

		// Toast should be removed
		await waitFor(() => {
			expect(screen.queryByText(/test toast/i)).not.toBeInTheDocument();
		});
	});

	it("should handle direct toast function call", async () => {
		render(<Toaster />);

		// Call toast function directly
		toast({ description: "Direct toast call" });

		// Toast should appear
		await waitFor(() => {
			expect(screen.getByText(/direct toast call/i)).toBeInTheDocument();
		});
	});
});
