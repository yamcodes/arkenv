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

	it("accepts custom className", () => {
		render(<Logo className="custom-class" />);

		const container = screen.getByText("ArkEnv").parentElement;
		expect(container).toHaveClass("custom-class");
	});
});
