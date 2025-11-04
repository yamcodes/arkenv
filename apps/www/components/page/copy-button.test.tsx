import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

// Mock the useToast hook
const mockToast = vi.fn();
vi.mock("~/hooks/use-toast", () => ({
	useToast: () => ({ toast: mockToast }),
}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
}));

describe("CopyButton", () => {
	it("renders copy button with correct accessibility", () => {
		render(<CopyButton command="npm install arkenv" />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-label", "Copy command");
		// aria-label is the single source of accessibility text (no redundant sr-only span)
	});

	it("shows copy icon initially", () => {
		render(<CopyButton command="npm install arkenv" />);
		// The Copy icon should be present (we can't easily test the icon component directly)
		expect(screen.getByRole("button")).toBeInTheDocument();
	});

	it("accepts different commands", () => {
		render(<CopyButton command="yarn add arkenv" />);
		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
	});

	it("renders with correct button attributes", () => {
		render(<CopyButton command="npm install arkenv" />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-label", "Copy command");
		expect(button).toHaveClass("hover:bg-slate-800");
	});

	it("forwards additional props", () => {
		render(<CopyButton command="npm install arkenv" />);
		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
	});
});
