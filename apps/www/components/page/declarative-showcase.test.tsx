import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeclarativeShowcase } from "./declarative-showcase";

describe("DeclarativeShowcase", () => {
	it("renders the Zero-Config Coercion badge and before/after types", () => {
		render(<DeclarativeShowcase />);

		expect(screen.getByText("Zero-Config Coercion")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Zero-config coercion" }),
		).toBeInTheDocument();

		const figure = screen.getByRole("figure", {
			name: /before and after comparison of env helper vs arkenv coercion/i,
		});
		expect(figure).toHaveTextContent("getEnv");
		expect(figure).toHaveTextContent('import { env } from "./env"');
		expect(figure).toHaveTextContent("PORT: string");
		expect(figure).toHaveTextContent("DEBUG: string");
		expect(figure).toHaveTextContent("PORT: number");
		expect(figure).toHaveTextContent("DEBUG: boolean");
	});
});
