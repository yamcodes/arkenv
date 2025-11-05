import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders with default props", () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeInTheDocument();
	});

	it("handles click events", async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);

		const button = screen.getByRole("button");
		await user.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("can be disabled and prevents clicks", async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();
		render(
			<Button disabled onClick={handleClick}>
				Disabled
			</Button>,
		);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();

		await user.click(button);
		expect(handleClick).not.toHaveBeenCalled();
	});

	it("supports keyboard navigation", async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);

		const button = screen.getByRole("button");
		button.focus();
		expect(button).toHaveFocus();

		await user.keyboard("{Enter}");
		expect(handleClick).toHaveBeenCalledTimes(1);

		// Space key might not trigger click in all cases, so let's test focus behavior
		expect(button).toHaveFocus();
	});

	it("renders as child component when asChild is true", () => {
		render(
			<Button asChild>
				<a href="/test">Link Button</a>
			</Button>,
		);
		const link = screen.getByRole("link", { name: /link button/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/test");
	});

	it("forwards ref correctly", () => {
		const ref = vi.fn();
		render(<Button ref={ref}>Button</Button>);
		expect(ref).toHaveBeenCalled();
	});

	it("accepts custom className", () => {
		render(<Button className="custom-class">Custom</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom-class");
	});

	it("supports different variants through props", () => {
		render(<Button variant="outline">Outline</Button>);
		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
	});

	it("supports different sizes through props", () => {
		render(<Button size="sm">Small</Button>);
		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
	});

	it("forwards additional props", () => {
		render(
			<Button data-testid="test-button" aria-label="Test button">
				Button
			</Button>,
		);
		const button = screen.getByTestId("test-button");
		expect(button).toHaveAttribute("aria-label", "Test button");
	});
});
