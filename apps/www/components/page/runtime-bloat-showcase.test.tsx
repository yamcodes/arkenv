import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuntimeBloatShowcase } from "./runtime-bloat-showcase";

describe("RuntimeBloatShowcase", () => {
	it("renders structured issues JSON instead of the edge bundle chart", () => {
		render(<RuntimeBloatShowcase />);

		expect(
			screen.getByRole("heading", { name: "Structured errors" }),
		).toBeInTheDocument();

		expect(
			screen.getByText(/Each issue gets a code CI and agents can act on/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Missing isn't the same fix as a bad value/i),
		).toBeInTheDocument();

		const figure = screen.getByRole("figure");
		expect(figure).toHaveTextContent('"success": false');
		expect(figure).toHaveTextContent("MISSING_VARIABLE");
		expect(figure).toHaveTextContent("INVALID_TYPE");
		expect(figure).toHaveTextContent('"path": "HOST"');
		expect(figure).toHaveTextContent('"path": "PORT"');
		expect(figure).not.toHaveTextContent("received");
		expect(figure).not.toHaveTextContent("DATABASE_URL");
		expect(figure).not.toHaveTextContent("$ arkenv check --json");

		expect(
			screen.queryByRole("heading", { name: "Errors you can automate" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(/Beautiful errors in the terminal/i),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/Same codes as/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/add it to/i)).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Optimized for the edge" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(/50% smaller core than T3 Env/i),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/varlock/i)).not.toBeInTheDocument();
		expect(screen.queryByText("@arkenv/standard")).not.toBeInTheDocument();
	});
});
