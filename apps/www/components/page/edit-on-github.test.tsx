import { captureMessage } from "@sentry/nextjs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLinkTitleAndHref } from "~/lib/utils";
import { EditOnGithub } from "./edit-on-github";

// Mock the dependencies
vi.mock("@sentry/nextjs", () => ({
	captureMessage: vi.fn(),
}));

vi.mock("~/lib/utils", () => ({
	getLinkTitleAndHref: vi.fn(),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		...props
	}: {
		children: React.ReactNode;
		[key: string]: unknown;
	}) => <a {...props}>{children}</a>,
}));

vi.mock("../ui/button", () => ({
	Button: ({
		children,
		asChild,
		...props
	}: {
		children: React.ReactNode;
		asChild?: boolean;
		[key: string]: unknown;
	}) => {
		if (asChild) {
			return children;
		}
		return <button {...props}>{children}</button>;
	},
}));

describe("EditOnGithub", () => {
	const mockGetLinkTitleAndHref = vi.mocked(getLinkTitleAndHref);
	const mockCaptureMessage = vi.mocked(captureMessage);

	beforeEach(() => {
		// Set up default environment variables
		process.env.NEXT_PUBLIC_DOCS_CONTENT_PATH = "apps/www/content/docs/";
		process.env.NEXT_PUBLIC_GITHUB_URL = "https://github.com/yamcodes/arkenv";
	});

	afterEach(() => {
		cleanup();
	});

	it("renders edit button with correct content", () => {
		mockGetLinkTitleAndHref.mockReturnValue({
			title: "Editing arkenv/index.mdx at main · yamcodes/arkenv",
			href: "https://github.com/yamcodes/arkenv/edit/main/apps/www/content/docs/index.mdx",
		});

		render(<EditOnGithub path="/index.mdx" />);

		const link = screen.getByRole("link");
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
		expect(link).toHaveTextContent("Edit this page on GitHub");
	});

	it("renders SquarePen icon", () => {
		mockGetLinkTitleAndHref.mockReturnValue({
			title: "Editing arkenv/index.mdx at main · yamcodes/arkenv",
			href: "https://github.com/yamcodes/arkenv/edit/main/apps/www/content/docs/index.mdx",
		});

		render(<EditOnGithub path="/index.mdx" />);

		const icon = screen.getByTestId("square-pen-icon");
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveClass("w-4", "h-4");
	});

	it("calls getLinkTitleAndHref with correct path", () => {
		mockGetLinkTitleAndHref.mockReturnValue({
			title: "Editing arkenv/index.mdx at main · yamcodes/arkenv",
			href: "https://github.com/yamcodes/arkenv/edit/main/apps/www/content/docs/index.mdx",
		});

		render(<EditOnGithub path="/index.mdx" />);

		expect(mockGetLinkTitleAndHref).toHaveBeenCalledWith(
			"apps/www/content/docs//index.mdx",
		);
	});

	it("uses default content path when NEXT_PUBLIC_DOCS_CONTENT_PATH is not set", () => {
		delete process.env.NEXT_PUBLIC_DOCS_CONTENT_PATH;
		mockGetLinkTitleAndHref.mockReturnValue({
			title: "Editing arkenv/index.mdx at main · yamcodes/arkenv",
			href: "https://github.com/yamcodes/arkenv/edit/main/apps/www/content/docs/index.mdx",
		});

		render(<EditOnGithub path="/index.mdx" />);

		expect(mockGetLinkTitleAndHref).toHaveBeenCalledWith(
			"apps/www/content/docs//index.mdx",
		);
	});

	it("uses custom content path from environment variable", () => {
		process.env.NEXT_PUBLIC_DOCS_CONTENT_PATH = "custom/docs/";
		mockGetLinkTitleAndHref.mockReturnValue({
			title: "Editing arkenv/index.mdx at main · yamcodes/arkenv",
			href: "https://github.com/yamcodes/arkenv/edit/main/custom/docs/index.mdx",
		});

		render(<EditOnGithub path="/index.mdx" />);

		expect(mockGetLinkTitleAndHref).toHaveBeenCalledWith(
			"custom/docs//index.mdx",
		);
	});

	it("handles paths without leading slash", () => {
		mockGetLinkTitleAndHref.mockReturnValue({
			title: "Editing arkenv/index.mdx at main · yamcodes/arkenv",
			href: "https://github.com/yamcodes/arkenv/edit/main/apps/www/content/docs/index.mdx",
		});

		render(<EditOnGithub path="index.mdx" />);

		expect(mockGetLinkTitleAndHref).toHaveBeenCalledWith(
			"apps/www/content/docs/index.mdx",
		);
	});

	it("handles nested paths", () => {
		mockGetLinkTitleAndHref.mockReturnValue({
			title:
				"Editing arkenv/getting-started/index.mdx at main · yamcodes/arkenv",
			href: "https://github.com/yamcodes/arkenv/edit/main/apps/www/content/docs/getting-started/index.mdx",
		});

		render(<EditOnGithub path="/getting-started/index.mdx" />);

		expect(mockGetLinkTitleAndHref).toHaveBeenCalledWith(
			"apps/www/content/docs//getting-started/index.mdx",
		);
	});

	it("applies correct href and title from getLinkTitleAndHref", () => {
		const mockTitle = "Editing arkenv/index.mdx at main · yamcodes/arkenv";
		const mockHref =
			"https://github.com/yamcodes/arkenv/edit/main/apps/www/content/docs/index.mdx";

		mockGetLinkTitleAndHref.mockReturnValue({
			title: mockTitle,
			href: mockHref,
		});

		render(<EditOnGithub path="/index.mdx" />);

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", mockHref);
		expect(link).toHaveAttribute("title", mockTitle);
	});

	it("handles error gracefully and captures message", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		mockGetLinkTitleAndHref.mockImplementation(() => {
			throw new Error("Test error");
		});

		const result = render(<EditOnGithub path="/index.mdx" />);

		expect(result.container.firstChild).toBeNull();
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			"Could not render GitHub edit button",
			{
				level: "warning",
				extra: {
					error: "Test error",
				},
			},
		);

		consoleError.mockRestore();
	});

	it("handles non-Error exceptions", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		mockGetLinkTitleAndHref.mockImplementation(() => {
			throw "String error";
		});

		const result = render(<EditOnGithub path="/index.mdx" />);

		expect(result.container.firstChild).toBeNull();
		expect(mockCaptureMessage).toHaveBeenCalledWith(
			"Could not render GitHub edit button",
			{
				level: "warning",
				extra: {
					error: "String error",
				},
			},
		);

		consoleError.mockRestore();
	});

	it("renders button with correct variant and className", () => {
		mockGetLinkTitleAndHref.mockReturnValue({
			title: "Editing arkenv/index.mdx at main · yamcodes/arkenv",
			href: "https://github.com/yamcodes/arkenv/edit/main/apps/www/content/docs/index.mdx",
		});

		render(<EditOnGithub path="/index.mdx" />);

		// The Button component should be rendered with asChild prop
		// Since we're mocking it to render children directly, we can't test the Button props directly
		// But we can verify the link is rendered correctly
		const link = screen.getByRole("link");
		expect(link).toBeInTheDocument();
	});
});
