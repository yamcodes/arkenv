import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuntimeBloatShowcase } from "./runtime-bloat-showcase";

describe("RuntimeBloatShowcase", () => {
	it("renders automatable error JSON instead of the edge bundle chart", () => {
		render(<RuntimeBloatShowcase />);

		expect(
			screen.getByRole("heading", { name: "Errors you can automate" }),
		).toBeInTheDocument();

		expect(
			screen.getByText(/Beautiful errors in the terminal/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Structured JSON for CI and agents/i),
		).toBeInTheDocument();

		const figure = screen.getByRole("figure");
		expect(figure).toHaveTextContent("$ arkenv check --json");
		expect(figure).toHaveTextContent('"success": false');
		expect(figure).toHaveTextContent("MISSING_VARIABLE");
		expect(figure).toHaveTextContent("INVALID_TYPE");
		expect(figure).toHaveTextContent('"path": "HOST"');
		expect(figure).toHaveTextContent('"path": "PORT"');
		expect(figure).not.toHaveTextContent("received");
		expect(figure).not.toHaveTextContent("DATABASE_URL");

		expect(screen.getByText(/add it to/i)).toBeInTheDocument();
		expect(screen.getByText(/fix the value/i)).toBeInTheDocument();

		expect(
			screen.queryByRole("heading", { name: "Optimized for the edge" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Structured errors" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(/50% smaller core than T3 Env/i),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/varlock/i)).not.toBeInTheDocument();
		expect(screen.queryByText("@arkenv/standard")).not.toBeInTheDocument();
	});
});
