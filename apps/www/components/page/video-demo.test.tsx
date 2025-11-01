import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VideoDemo } from "./video-demo";

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, "open", {
	value: mockWindowOpen,
	writable: true,
});

describe("VideoDemo", () => {
	beforeEach(() => {
		mockWindowOpen.mockClear();
	});

	it("renders video demo container", () => {
		render(<VideoDemo />);

		const container = screen.getByRole("button");
		expect(container).toBeInTheDocument();
		expect(container).toHaveClass("relative", "rounded-lg", "overflow-hidden");
	});

	it("renders video element with correct attributes", () => {
		render(<VideoDemo />);

		const video = screen.getByRole("button").querySelector("video");
		expect(video).toBeInTheDocument();
		expect(video).toHaveAttribute("autoPlay");
		expect(video).toHaveAttribute("loop");
		expect(video).toHaveProperty("muted", true);
		expect(video).toHaveAttribute("playsInline");
		expect(video).toHaveAttribute("width", "958");
		expect(video).toHaveAttribute("poster", "/assets/demo.png");
		expect(video).toHaveClass(
			"block",
			"max-h-[600px]",
			"sm:max-h-[1000px]",
			"object-contain",
		);
	});

	it("renders video source with correct URL", () => {
		render(<VideoDemo />);

		const source = screen.getByRole("button").querySelector("source");
		expect(source).toBeInTheDocument();
		expect(source).toHaveAttribute(
			"src",
			"https://x9fkbqb4whr3w456.public.blob.vercel-storage.com/hero.mp4",
		);
		expect(source).toHaveAttribute("type", "video/mp4");
	});

	it("renders fallback text for unsupported browsers", () => {
		render(<VideoDemo />);

		const fallbackText = screen.getByText(
			"You need a browser that supports HTML5 video to view this video.",
		);
		expect(fallbackText).toBeInTheDocument();
	});

	it("has correct button styling classes", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		expect(button).toHaveClass(
			"relative",
			"rounded-lg",
			"overflow-hidden",
			"border",
			"border-fd-border",
			"shadow-lg",
			"bg-black/5",
			"dark:bg-black/20",
			"cursor-pointer",
			"m-0",
			"p-0",
			"shadow-[0_0_20px_rgba(96,165,250,0.6)]",
			"dark:shadow-[0_0_100px_rgba(96,165,250,0.2)]",
		);
	});

	it("has correct aria-label for accessibility", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		expect(button).toHaveAttribute(
			"aria-label",
			"Open interactive demo in a new tab",
		);
	});

	it("has correct button type", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("type", "button");
	});

	it("opens StackBlitz URL when clicked", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(mockWindowOpen).toHaveBeenCalledWith(
			"https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/basic?file=index.ts",
			"_blank",
			"noopener,noreferrer",
		);
		expect(mockWindowOpen).toHaveBeenCalledTimes(1);
	});

	it("opens correct StackBlitz URL with specific file", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		const expectedUrl =
			"https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/basic?file=index.ts";
		expect(mockWindowOpen).toHaveBeenCalledWith(
			expectedUrl,
			"_blank",
			"noopener,noreferrer",
		);
	});

	it("handles multiple clicks correctly", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");

		// Click multiple times
		fireEvent.click(button);
		fireEvent.click(button);
		fireEvent.click(button);

		expect(mockWindowOpen).toHaveBeenCalledTimes(3);
	});

	it("has correct container styling", () => {
		render(<VideoDemo />);

		const container = screen.getByRole("button").parentElement;
		expect(container).toHaveClass("inline-block", "relative", "mb-4");
	});

	it("video has correct dimensions and styling", () => {
		render(<VideoDemo />);

		const video = screen.getByRole("button").querySelector("video");
		expect(video).toHaveClass(
			"block",
			"max-h-[600px]",
			"sm:max-h-[1000px]",
			"object-contain",
		);
		expect(video).toHaveAttribute("width", "958");
	});

	it("maintains video autoplay and loop behavior", () => {
		render(<VideoDemo />);

		const video = screen.getByRole("button").querySelector("video");
		expect(video).toHaveAttribute("autoPlay");
		expect(video).toHaveAttribute("loop");
		expect(video).toHaveProperty("muted", true);
		expect(video).toHaveAttribute("playsInline");
	});

	it("has proper video source configuration", () => {
		render(<VideoDemo />);

		const video = screen.getByRole("button").querySelector("video");
		const source = video?.querySelector("source");

		expect(source).toHaveAttribute(
			"src",
			"https://x9fkbqb4whr3w456.public.blob.vercel-storage.com/hero.mp4",
		);
		expect(source).toHaveAttribute("type", "video/mp4");
	});

	it("button is focusable and clickable", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
		expect(button).not.toBeDisabled();

		// Test that it can be focused
		button.focus();
		expect(document.activeElement).toBe(button);
	});

	it("handles window.open failure gracefully", () => {
		// Mock window.open to return null (simulating popup blocked)
		mockWindowOpen.mockReturnValue(null);

		render(<VideoDemo />);

		const button = screen.getByRole("button");

		// Should not throw an error when clicking
		expect(() => fireEvent.click(button)).not.toThrow();
		expect(mockWindowOpen).toHaveBeenCalledWith(
			"https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/basic?file=index.ts",
			"_blank",
			"noopener,noreferrer",
		);
	});

	it("falls back to demo.gif when video fails to load", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		const video = button.querySelector("video");

		// Initially, video should be present
		expect(video).toBeInTheDocument();

		// Simulate video error
		fireEvent.error(video!);

		// After error, video should be replaced with img
		expect(button.querySelector("video")).not.toBeInTheDocument();
		const img = button.querySelector("img");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("src", "/assets/demo.gif");
		expect(img).toHaveAttribute("alt", "ArkEnv Demo");
		expect(img).toHaveAttribute("width", "958");
		expect(img).toHaveClass(
			"block",
			"max-h-[600px]",
			"sm:max-h-[1000px]",
			"object-contain",
		);
	});

	it("maintains button click behavior after fallback to demo.gif", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		const video = button.querySelector("video");

		// Simulate video error
		fireEvent.error(video!);

		// Button should still be clickable and open StackBlitz URL
		fireEvent.click(button);

		expect(mockWindowOpen).toHaveBeenCalledWith(
			"https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/basic?file=index.ts",
			"_blank",
			"noopener,noreferrer",
		);
	});
});
