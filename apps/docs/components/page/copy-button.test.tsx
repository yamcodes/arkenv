import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
}));

// Mock the useToast hook
vi.mock("~/hooks/use-toast", () => ({
	useToast: () => ({
		toast: vi.fn(),
	}),
}));

describe("CopyButton", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders with initial state", () => {
		render(<CopyButton command="npm install" />);
		expect(screen.getByRole("button")).toBeInTheDocument();
		expect(screen.getByLabelText("Copy command")).toBeInTheDocument();
	});

	it("shows copied state when clicked", async () => {
		const user = userEvent.setup();
		const mockWriteText = vi.fn();

		// Mock the clipboard API
		const clipboardSpy = vi.spyOn(navigator.clipboard, "writeText");
		clipboardSpy.mockImplementation(mockWriteText);

		render(<CopyButton command="npm install" />);
		const button = screen.getByRole("button");

		await user.click(button);

		expect(mockWriteText).toHaveBeenCalledWith("npm install");
		expect(screen.getByLabelText("Copy command")).toBeInTheDocument();
	});

	it("handles clipboard error", async () => {
		const user = userEvent.setup();

		// Mock the clipboard API with an error
		const clipboardSpy = vi.spyOn(navigator.clipboard, "writeText");
		clipboardSpy.mockRejectedValue(new Error("Clipboard error"));

		render(<CopyButton command="npm install" />);
		const button = screen.getByRole("button");

		await user.click(button);

		expect(clipboardSpy).toHaveBeenCalledWith("npm install");
		expect(screen.getByLabelText("Copy command")).toBeInTheDocument();
	});
});
