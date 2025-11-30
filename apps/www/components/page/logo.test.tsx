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
		// Check for the image element
		const img = document.querySelector("img");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute(
			"src",
			expect.stringContaining("/assets/icon.svg"),
		);
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
		expect(text).toHaveClass("leading-none");

		const img = document.querySelector("img");
		// next/image might apply styles differently, but we passed className="size-6"
		expect(img).toHaveClass("size-6");
	});

	it("accepts custom className", () => {
		render(<Logo className="custom-class" />);

		const container = screen.getByText("ArkEnv").parentElement;
		expect(container).toHaveClass("custom-class");
	});
});
