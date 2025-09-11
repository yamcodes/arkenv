import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

// Mock the dependencies that are causing issues
vi.mock("~/hooks/use-toast", () => ({
	useToast: () => ({
		toast: vi.fn(),
	}),
}));

vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
}));

describe("CopyButton", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders copy button", () => {
		render(<CopyButton command="npm install arkenv" />);

		const button = screen.getByRole("button", { name: /copy command/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute("aria-label", "Copy command");
	});

	it("has correct styling classes", () => {
		render(<CopyButton command="test" />);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("hover:bg-slate-800");
		expect(button).toHaveClass("text-slate-400");
		expect(button).toHaveClass("hover:text-slate-100");
	});

	it("has screen reader text", () => {
		render(<CopyButton command="test" />);

		const srText = screen.getByText("Copy command");
		expect(srText).toHaveClass("sr-only");
	});
});
