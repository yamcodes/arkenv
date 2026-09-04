import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeclarativeShowcase } from "./declarative-showcase";

describe("DeclarativeShowcase", () => {
	it("renders the 3-row alternating payload pipeline with enum NODE_ENV row", () => {
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
		expect(figure).toHaveTextContent("NODE_ENV=");

		// Row 1 alternating chips ("3000" success vs "oops" failure)
		expect(figure).toHaveTextContent('"3000"');
		expect(figure).toHaveTextContent('"oops"');

		// Row 2 alternating chips ("true" vs "false")
		expect(figure).toHaveTextContent('"true"');
		expect(figure).toHaveTextContent('"false"');

		// Row 3 alternating chips ("production" vs "development")
		expect(figure).toHaveTextContent('"production"');
		expect(figure).toHaveTextContent('"development"');

		// Schema Gates
		expect(figure).toHaveTextContent('"number"');
		expect(figure).toHaveTextContent('"boolean"');
		expect(figure).toHaveTextContent(
			"\"'development' | 'production' | 'test'\"",
		);

		// Destination Type Definitions
		expect(figure).toHaveTextContent("number");
		expect(figure).toHaveTextContent("boolean");
		expect(figure).toHaveTextContent(
			'"development" | "production" | "test"',
		);
	});

	it("renders mobile direct single-wire elements and carrier tokens in the markup", () => {
		const { container } = render(<DeclarativeShowcase />);

		const directWires = container.querySelectorAll(
			".home-aurora__payload-wire--direct",
		);
		expect(directWires).toHaveLength(3);

		const portCarrier = container.querySelector(
			".home-aurora__payload-carrier--port",
		);
		expect(portCarrier).toBeInTheDocument();
		expect(portCarrier).toHaveTextContent('"3000"');
		expect(portCarrier).toHaveTextContent("3000");

		const debugTrueCarrier = container.querySelector(
			".home-aurora__payload-carrier--debug-true",
		);
		expect(debugTrueCarrier).toBeInTheDocument();
		expect(debugTrueCarrier).toHaveTextContent('"true"');
		expect(debugTrueCarrier).toHaveTextContent("true");

		const debugFalseCarrier = container.querySelector(
			".home-aurora__payload-carrier--debug-false",
		);
		expect(debugFalseCarrier).toBeInTheDocument();
		expect(debugFalseCarrier).toHaveTextContent('"false"');
		expect(debugFalseCarrier).toHaveTextContent("false");

		const nodeenvProdCarrier = container.querySelector(
			".home-aurora__payload-carrier--nodeenv-prod",
		);
		expect(nodeenvProdCarrier).toBeInTheDocument();
		expect(nodeenvProdCarrier).toHaveTextContent('"production"');

		const nodeenvDevCarrier = container.querySelector(
			".home-aurora__payload-carrier--nodeenv-dev",
		);
		expect(nodeenvDevCarrier).toBeInTheDocument();
		expect(nodeenvDevCarrier).toHaveTextContent('"development"');
	});
});
