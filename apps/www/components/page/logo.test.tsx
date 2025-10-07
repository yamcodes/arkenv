import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Logo } from "./logo";

describe("Logo", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders the ArkEnv text", () => {
		render(<Logo />);

		const logo = screen.getByText("ArkEnv");
		expect(logo).toBeInTheDocument();
	});

	it("applies default styling classes", () => {
		render(<Logo />);

		const logo = screen.getByText("ArkEnv");
		expect(logo).toHaveClass("font-bold");
		expect(logo).toHaveClass("text-fd-foreground");
		expect(logo).toHaveClass("decoration-wavy");
		expect(logo).toHaveClass("underline");
	});

	it("accepts custom className", () => {
		render(<Logo className="custom-class" />);

		const logo = screen.getByText("ArkEnv");
		expect(logo).toHaveClass("custom-class");
		expect(logo).toHaveClass("font-bold"); // should still have default classes
	});

	it("renders as a code element", () => {
		render(<Logo />);

		const logo = screen.getByText("ArkEnv");
		expect(logo.tagName).toBe("CODE");
	});
});
