import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FailFastShowcase } from "./fail-fast-showcase";

describe("FailFastShowcase", () => {
	it("renders the Fail-fast at startup terminal mock with ArkEnvError", () => {
		render(<FailFastShowcase />);

		expect(
			screen.getByRole("heading", { name: "Fail-fast at startup" }),
		).toBeInTheDocument();

		const figure = screen.getByRole("img", {
			name: /terminal running npm run dev/i,
		});
		expect(figure).toHaveTextContent("$ npm run dev");
		expect(figure).toHaveTextContent("ArkEnvError:");
		expect(figure).toHaveTextContent(
			"Errors found while validating environment variables",
		);
		expect(figure).toHaveTextContent(
			"DATABASE_URL must be a URL string (was [REDACTED])",
		);
		expect(figure).toHaveTextContent("PORT must be a number (was a string)");
	});
});
