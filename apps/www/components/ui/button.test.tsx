import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders with default props", () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("h-9", "px-4", "py-2"); // default size
		expect(button).toHaveClass("bg-primary", "text-primary-foreground"); // default variant
	});

	it("renders with different variants", () => {
		render(<Button variant="outline">Outline</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("border", "border-input", "bg-background");
	});

	it("renders with ghost variant", () => {
		render(<Button variant="ghost">Ghost</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("hover:bg-accent");
	});

	it("renders with destructive variant", () => {
		render(<Button variant="destructive">Destructive</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("bg-destructive", "text-destructive-foreground");
	});

	it("renders with small size", () => {
		render(<Button size="sm">Small</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("h-8", "px-3", "text-xs");
	});

	it("renders with large size", () => {
		render(<Button size="lg">Large</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("h-10", "px-8");
	});

	it("renders with icon size", () => {
		render(<Button size="icon">Icon</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("h-9", "w-9");
	});

	it("can be disabled", () => {
		render(<Button disabled>Disabled</Button>);
		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
		expect(button).toHaveClass(
			"disabled:pointer-events-none",
			"disabled:opacity-50",
		);
	});

	it("accepts custom className", () => {
		render(<Button className="custom-class">Custom</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom-class");
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
});
