import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Logo } from "./logo";

describe("Logo", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders the ArkEnv text", () => {
		render(<Logo />);

		const logoText = screen.getByText("ArkEnv");
		expect(logoText).toBeInTheDocument();
	});

	it("renders the logo icon", () => {
		render(<Logo />);
		// Check for the inline SVG element via the container
		const logoText = screen.getByText("ArkEnv");
		const container = logoText.parentElement;
		const svg = container?.querySelector("svg");
		expect(svg).toBeInTheDocument();
	});

	it("applies default styling classes", () => {
		render(<Logo />);

		const container = screen.getByText("ArkEnv").parentElement;
		expect(container).toHaveClass("flex");
		expect(container).toHaveClass("items-center");
		expect(container).toHaveClass("gap-2");

		const text = screen.getByText("ArkEnv");
		expect(text).toHaveClass("font-medium");
		expect(text).toHaveClass("text-fd-foreground");
		expect(text).toHaveClass("text-sm");
	});

	it("accepts custom className", () => {
		render(<Logo className="custom-class" />);

		const container = screen.getByText("ArkEnv").parentElement;
		expect(container).toHaveClass("custom-class");
	});
});
