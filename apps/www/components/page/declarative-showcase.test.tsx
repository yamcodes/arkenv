import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeclarativeShowcase } from "./declarative-showcase";

describe("DeclarativeShowcase", () => {
	it("renders the heading and .env file document node graph with coercion values", () => {
		render(<DeclarativeShowcase />);

		expect(
			screen.getByRole("heading", { name: "Automatic coercion" }),
		).toBeInTheDocument();

		const figure = screen.getByRole("figure", {
			name: /node graph visualizing automatic type coercion/i,
		});

		// Source .env file document preview (no quotation marks)
		expect(figure).toHaveTextContent(".env");
		expect(figure).toHaveTextContent("PORT=3000");
		expect(figure).toHaveTextContent("DEBUG=true");
		expect(figure).toHaveTextContent("LOG_LEVEL=debug");

		// Destination typed primitives
		expect(figure).toHaveTextContent("number");
		expect(figure).toHaveTextContent("3000");
		expect(figure).toHaveTextContent("boolean");
		expect(figure).toHaveTextContent("true");
		expect(figure).toHaveTextContent('"debug" | "info"');
		expect(figure).toHaveTextContent('"debug"');
	});
});
