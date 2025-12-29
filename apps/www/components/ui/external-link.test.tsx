import { render, screen } from "@testing-library/react";
import type { ComponentPropsWithoutRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { ExternalLink } from "./external-link";

// Mock the fumadocs-core/link module
vi.mock("fumadocs-core/link", () => ({
	default: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

describe("ExternalLink", () => {
	describe("external link detection", () => {
		it("should render arrow icon for external HTTP links", () => {
			render(
				<ExternalLink href="https://example.com">External Link</ExternalLink>,
			);
			const link = screen.getByText("External Link");
			expect(link).toBeInTheDocument();
			// Check for arrow icon by checking data-external-link attribute is present
			const a = link.closest("a");
			expect(a).toHaveAttribute("data-external-link", "true");
		});

		it("should render arrow icon for external HTTPS links", () => {
			render(
				<ExternalLink href="https://arktype.io">ArkType Docs</ExternalLink>,
			);
			const link = screen.getByText("ArkType Docs");
			const a = link.closest("a");
			expect(a).toHaveAttribute("data-external-link", "true");
		});

		it("should NOT render arrow icon for internal relative links", () => {
			render(
				<ExternalLink href="/docs/quickstart">Internal Link</ExternalLink>,
			);
			const link = screen.getByText("Internal Link");
			const a = link.closest("a");
			expect(a).not.toHaveAttribute("data-external-link");
		});

		it("should NOT render arrow icon for hash links", () => {
			render(<ExternalLink href="#section">Hash Link</ExternalLink>);
			const link = screen.getByText("Hash Link");
			const a = link.closest("a");
			expect(a).not.toHaveAttribute("data-external-link");
		});

		it("should NOT render arrow icon when href is undefined", () => {
			render(<ExternalLink>No Href Link</ExternalLink>);
			const link = screen.getByText("No Href Link");
			const a = link.closest("a");
			expect(a).not.toHaveAttribute("data-external-link");
		});

		it("should NOT render arrow icon for arkenv.js.org links (same domain)", () => {
			render(
				<ExternalLink href="https://arkenv.js.org/docs/arkenv">
					Same Domain Link
				</ExternalLink>,
			);
			const link = screen.getByText("Same Domain Link");
			const a = link.closest("a");
			expect(a).not.toHaveAttribute("data-external-link");
		});

		it("should NOT render arrow icon for localhost links", () => {
			render(
				<ExternalLink href="http://localhost:3000/docs">
					Localhost Link
				</ExternalLink>,
			);
			const link = screen.getByText("Localhost Link");
			const a = link.closest("a");
			expect(a).not.toHaveAttribute("data-external-link");
		});
	});

	describe("link rendering", () => {
		it("should render using fumadocs Link component", () => {
			render(
				<ExternalLink href="https://example.com">External Link</ExternalLink>,
			);
			const link = screen.getByText("External Link").closest("a");
			expect(link).toHaveAttribute("href", "https://example.com");
		});

		it("should preserve other HTML attributes", () => {
			render(
				<ExternalLink href="/docs" data-testid="test-link" aria-label="Test">
					Link
				</ExternalLink>,
			);
			const link = screen.getByText("Link").closest("a");
			expect(link).toHaveAttribute("data-testid", "test-link");
			expect(link).toHaveAttribute("aria-label", "Test");
		});
	});

	describe("accessibility", () => {
		it("should NOT render an SVG icon (it is decorative CSS background)", () => {
			render(
				<ExternalLink href="https://example.com">External Link</ExternalLink>,
			);
			const link = screen.getByText("External Link").closest("a");
			const svg = link?.querySelector("svg");
			expect(svg).not.toBeInTheDocument();
		});
	});
});
