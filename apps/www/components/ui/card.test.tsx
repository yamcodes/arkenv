import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Card } from "./card";

describe("Card", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders children content", () => {
		render(
			<Card>
				<h2>Test Title</h2>
				<p>Test content</p>
			</Card>,
		);

		expect(screen.getByText("Test Title")).toBeInTheDocument();
		expect(screen.getByText("Test content")).toBeInTheDocument();
	});

	it("applies the [&>p:last-child]:mb-0 class", () => {
		const { container } = render(
			<Card data-testid="test-card">
				<p>First paragraph</p>
				<p>Last paragraph</p>
			</Card>,
		);

		const card = container.querySelector('[data-card="true"]');
		expect(card).toHaveClass("[&>p:last-child]:mb-0");
	});

	it("accepts and forwards additional props", () => {
		render(
			<Card data-testid="unique-card" title="Card Title">
				<p>Content</p>
			</Card>,
		);

		const card = screen.getByTestId("unique-card");
		expect(card).toBeInTheDocument();
	});
});
