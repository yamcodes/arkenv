import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeclarativeShowcase } from "./declarative-showcase";

describe("DeclarativeShowcase", () => {
	it("renders the 2-row minimalist typographic data stream", () => {
		render(<DeclarativeShowcase />);

		expect(
			screen.getByRole("heading", { name: "Automatic coercion" }),
		).toBeInTheDocument();

		const figure = screen.getByRole("figure", {
			name: /minimalist data stream showing raw environment strings/i,
		});

		// Column 1: Raw .env inputs
		expect(figure).toHaveTextContent("PORT=");
		expect(figure).toHaveTextContent("3000");
		expect(figure).toHaveTextContent("DEBUG=");
		expect(figure).toHaveTextContent("false");

		// Column 2: ArkEnv Schema DSL tokens
		expect(figure).toHaveTextContent('"number"');
		expect(figure).toHaveTextContent('"boolean"');

		// Column 3: Inferred primitives
		expect(figure).toHaveTextContent("3000");
		expect(figure).toHaveTextContent("false");

		// No redundant sub-labels or column headers
		expect(figure).not.toHaveTextContent("LOG_LEVEL");
		expect(figure).not.toHaveTextContent("arkenv schema");
		expect(figure).not.toHaveTextContent("typed env");
	});
});
