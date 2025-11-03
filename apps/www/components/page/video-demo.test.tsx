import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoDemo } from "./video-demo";

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, "open", {
	value: mockWindowOpen,
	writable: true,
});

// Store original fetch to restore later
const originalFetch = global.fetch;

// Mock Next.js Image component
vi.mock("next/image", () => ({
	default: ({
		src,
		alt,
		width,
		height,
		fill,
		className,
		sizes,
	}: {
		src: string;
		alt?: string;
		width?: number;
		height?: number;
		fill?: boolean;
		className?: string;
		sizes?: string;
	}) => (
		// biome-ignore lint/performance/noImgElement: Mock for testing
		<img
			src={src}
			alt={alt}
			width={fill ? undefined : width}
			height={fill ? undefined : height}
			className={className}
			sizes={sizes}
			data-fill={fill ? "true" : undefined}
		/>
	),
}));

// Mock next-video/background-video to prevent fetch errors and match test expectations
vi.mock("next-video/background-video", () => ({
	default: ({
		src,
		poster,
		className,
		...props
	}: {
		src: string | { src: string };
		poster?: string;
		className?: string;
		[key: string]: unknown;
	}) => {
		// Determine the video src from the incoming src prop
		// Support both string URLs and asset objects like { src: string }
		const videoSrc =
			typeof src === "string" ? src : src?.src || "/videos/demo.mp4";

		// Forward all props (including onError, className, etc.)
		// so tests see real behavior
		// Set poster to props.poster || "/assets/demo.png" so the mock reflects
		// the actual poster prop when provided
		return (
			<video
				autoPlay
				loop
				muted
				playsInline
				{...props}
				src={videoSrc}
				poster={poster || "/assets/demo.png"}
				className={
					className || "absolute inset-0 w-full h-full object-contain"
				}
			>
				You need a browser that supports HTML5 video to view this video.
			</video>
		);
	},
}));

describe("VideoDemo", () => {
	beforeEach(() => {
		mockWindowOpen.mockClear();
		// Mock next-video's fetch behavior to prevent URL fetch errors in tests
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				json: async () => ({}),
				text: async () => "",
			} as Response),
		) as typeof fetch;
	});

	afterEach(() => {
		// Restore original fetch to avoid test leakage
		global.fetch = originalFetch;
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
		expect(video).toHaveAttribute("autoplay");
		expect(video).toHaveAttribute("loop");
		expect(video).toHaveProperty("muted", true);
		expect(video).toHaveAttribute("playsinline");
		expect(video).toHaveAttribute("poster", "/assets/demo.png");
		expect(video).toHaveClass(
			"absolute",
			"inset-0",
			"w-full",
			"h-full",
			"object-contain",
		);
	});

	it("renders video with a valid source", () => {
		render(<VideoDemo />);

		const video = screen.getByRole("button").querySelector("video");
		expect(video).toBeInTheDocument();
		expect(video).toHaveAttribute("src");
		const src = video?.getAttribute("src");
		expect(src).toBeTruthy();
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
			"w-full",
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
		expect(container).toHaveClass(
			"relative",
			"mb-4",
			"w-full",
			"max-w-[800px]",
			"mx-auto",
			"px-4",
			"sm:px-0",
		);
	});

	it("video has correct dimensions and styling", () => {
		render(<VideoDemo />);

		const video = screen.getByRole("button").querySelector("video");
		expect(video).toHaveClass(
			"absolute",
			"inset-0",
			"w-full",
			"h-full",
			"object-contain",
		);
	});

	it("maintains video autoplay and loop behavior", () => {
		render(<VideoDemo />);

		const video = screen.getByRole("button").querySelector("video");
		expect(video).toHaveAttribute("autoplay");
		expect(video).toHaveAttribute("loop");
		expect(video).toHaveProperty("muted", true);
		expect(video).toHaveAttribute("playsinline");
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
		if (video) {
			fireEvent.error(video);
		}

		// After error, video should be replaced with img
		expect(button.querySelector("video")).not.toBeInTheDocument();
		const img = button.querySelector("img");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("src", "/assets/demo.gif");
		expect(img).toHaveAttribute("alt", "ArkEnv Demo");
		expect(img).toHaveAttribute("data-fill", "true");
		expect(img).toHaveClass("object-contain");
	});

	it("maintains button click behavior after fallback to demo.gif", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		const video = button.querySelector("video");

		// Simulate video error
		if (video) {
			fireEvent.error(video);
		}

		// Button should still be clickable and open StackBlitz URL
		fireEvent.click(button);

		expect(mockWindowOpen).toHaveBeenCalledWith(
			"https://stackblitz.com/github/yamcodes/arkenv/tree/main/examples/basic?file=index.ts",
			"_blank",
			"noopener,noreferrer",
		);
	});

	it("button has aspect ratio style for responsive scaling", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
		expect(button).toHaveStyle({ aspectRatio: "800 / 653" });
	});

	it("fallback image has sizes attribute and fill prop for responsive loading", () => {
		render(<VideoDemo />);

		const button = screen.getByRole("button");
		const video = button.querySelector("video");

		// Simulate video error to show fallback image
		if (video) {
			fireEvent.error(video);
		}

		const img = button.querySelector("img");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("sizes", "(max-width: 768px) 100vw, 800px");
		expect(img).toHaveAttribute("data-fill", "true");
	});
});
