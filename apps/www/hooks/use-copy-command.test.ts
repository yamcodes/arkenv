import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCopyCommand } from "./use-copy-command";

// Mock dependencies
const mockToast = vi.fn();
vi.mock("./use-toast", () => ({
	useToast: () => ({ toast: mockToast }),
}));

vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
}));

describe("useCopyCommand", () => {
	let mockWriteText: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockWriteText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", {
			clipboard: {
				writeText: mockWriteText,
			},
		});
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	it("should initialize with copied as false", () => {
		const { result } = renderHook(() => useCopyCommand("npm install arkenv"));
		expect(result.current.copied).toBe(false);
	});

	it("should copy text to clipboard and update state", async () => {
		const command = "npm install arkenv";
		const { result } = renderHook(() => useCopyCommand(command));

		await act(async () => {
			await result.current.copy();
		});

		expect(mockWriteText).toHaveBeenCalledWith(command);
		expect(result.current.copied).toBe(true);
		expect(mockToast).toHaveBeenCalledWith({
			description: "Command copied to clipboard!",
			duration: 2000,
		});
	});

	it("should reset copied state after 2 seconds", async () => {
		const { result } = renderHook(() => useCopyCommand("npm install arkenv"));

		await act(async () => {
			await result.current.copy();
		});

		expect(result.current.copied).toBe(true);

		await act(async () => {
			vi.advanceTimersByTime(2000);
		});

		expect(result.current.copied).toBe(false);
	});

	it("should handle clipboard errors", async () => {
		const error = new Error("Clipboard failed");
		mockWriteText.mockRejectedValue(error);

		const { result } = renderHook(() => useCopyCommand("npm install arkenv"));

		await act(async () => {
			await result.current.copy();
		});

		expect(result.current.copied).toBe(false);
		expect(mockToast).toHaveBeenCalledWith({
			title: "Uh oh! Something went wrong.",
			description: "There was a problem copying the command to your clipboard.",
			variant: "destructive",
		});
	});
});
