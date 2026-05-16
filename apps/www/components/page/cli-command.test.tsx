import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CLICommand } from "./cli-command";

// Mock useCopyCommand
const mockCopy = vi.fn();
vi.mock("~/hooks/use-copy-command", () => ({
	useCopyCommand: (_command: string) => ({
		copy: mockCopy,
		copied: false,
	}),
}));

// Mock CopyButton to simplify
vi.mock("./copy-button", () => ({
	CopyButton: ({ onClick }: { onClick: () => void }) => (
		// biome-ignore lint/a11y/useKeyWithClickEvents: simple mock
		// biome-ignore lint/a11y/noStaticElementInteractions: simple mock
		<span onClick={onClick}>Copy</span>
	),
}));

describe("CLICommand", () => {
	it("renders correctly with syntax highlighting", () => {
		render(<CLICommand />);

		expect(screen.getByText("npx")).toHaveClass("text-blue-600");
		expect(screen.getByText("@arkenv/cli@latest")).toHaveClass(
			"text-emerald-600",
		);
		expect(screen.getByText("init")).toHaveClass("text-slate-700");
	});

	it("triggers copy when clicked", () => {
		render(<CLICommand />);

		const commandBar = screen.getByRole("button");
		fireEvent.click(commandBar);

		expect(mockCopy).toHaveBeenCalled();
	});

	it("triggers copy when Enter is pressed", () => {
		render(<CLICommand />);

		const commandBar = screen.getByRole("button");
		fireEvent.keyDown(commandBar, { key: "Enter" });

		expect(mockCopy).toHaveBeenCalled();
	});

	it("triggers copy when Space is pressed", () => {
		render(<CLICommand />);

		const commandBar = screen.getByRole("button");
		fireEvent.keyDown(commandBar, { key: " " });

		expect(mockCopy).toHaveBeenCalled();
	});
});
