import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeclarativeShowcase } from "./declarative-showcase";

describe("DeclarativeShowcase", () => {
	it("renders the 2-row alternating payload pipeline with true/false debug toggles", () => {
		render(<DeclarativeShowcase />);

		expect(
			screen.getByRole("heading", { name: "Automatic coercion" }),
		).toBeInTheDocument();

		const figure = screen.getByRole("figure", {
			name: /payload pipeline showing valid strings coerced into primitives and invalid strings caught/i,
		});

		// Static keys
		expect(figure).toHaveTextContent("PORT=");
		expect(figure).toHaveTextContent("DEBUG=");

		// Row 1 alternating chips ("3000" success vs "oops" failure)
		expect(figure).toHaveTextContent('"3000"');
		expect(figure).toHaveTextContent('"oops"');

		// Row 2 alternating chips ("true" vs "false")
		expect(figure).toHaveTextContent('"true"');
		expect(figure).toHaveTextContent('"false"');

		// Schema Gates
		expect(figure).toHaveTextContent('"number"');
		expect(figure).toHaveTextContent('"boolean"');

		// Destination Type Definitions
		expect(figure).toHaveTextContent("number");
		expect(figure).toHaveTextContent("boolean");
	});
});
