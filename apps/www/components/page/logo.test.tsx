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

	it("hides the wordmark when wordmark is false", () => {
		render(<Logo wordmark={false} />);

		expect(screen.queryByText("ArkEnv")).not.toBeInTheDocument();
	});

	it("accepts custom className", () => {
		render(<Logo className="custom-class" />);

		const container = screen.getByText("ArkEnv").closest(".logo");
		expect(container).toHaveClass("custom-class");
	});

	it("shows a decorative RC chip when releaseTag is rc", () => {
		render(<Logo releaseTag="rc" />);

		const rc = screen.getByText("RC");
		expect(rc).toBeInTheDocument();
		expect(rc.tagName).toBe("SPAN");
		expect(rc).toHaveAttribute("aria-hidden", "true");
		expect(rc.closest("a")).toBeNull();
	});

	it("hides the RC chip when releaseTag is not rc", () => {
		render(<Logo releaseTag="alpha" />);

		expect(screen.queryByText("RC")).not.toBeInTheDocument();
	});

	it("hides the RC chip when wordmark is false even if releaseTag is rc", () => {
		render(<Logo wordmark={false} releaseTag="rc" />);

		expect(screen.queryByText("RC")).not.toBeInTheDocument();
	});
});
