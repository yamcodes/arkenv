import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RuntimeBloatShowcase } from "./runtime-bloat-showcase";

const HOST_MESSAGE = 'must be a string or "localhost" (was missing)';
const PORT_MESSAGE = "must be a number (was a string)";

describe("RuntimeBloatShowcase", () => {
	it("renders structured issues JSON instead of the edge bundle chart", () => {
		render(<RuntimeBloatShowcase />);

		expect(
			screen.getByRole("heading", { name: "Structured errors" }),
		).toBeInTheDocument();

		expect(
			screen.getByText(/Each issue gets a code that agents and CI can act on/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Missing keys and bad values aren't the same/i),
		).toBeInTheDocument();

		expect(screen.queryByText("{ safe: true }")).not.toBeInTheDocument();
		expect(screen.getByText("json")).toBeInTheDocument();

		const figure = screen.getByRole("figure");
		expect(figure).toHaveTextContent('"success": false');
		expect(figure).toHaveTextContent('"issues"');
		expect(figure).toHaveTextContent("MISSING_VARIABLE");
		expect(figure).toHaveTextContent("INVALID_TYPE");
		expect(figure).toHaveTextContent('"path": "HOST"');
		expect(figure).toHaveTextContent('"path": "PORT"');
		expect(figure).toHaveTextContent('"message"');
		expect(figure).toHaveTextContent("…");
		// stacked fields: each key on its own line in the source string
		expect(figure).toHaveTextContent(/\{\s*"path": "HOST"/);
		expect(figure).not.toHaveTextContent(HOST_MESSAGE);
		expect(figure).not.toHaveTextContent(PORT_MESSAGE);
		expect(figure).not.toHaveTextContent("received");
		expect(figure).not.toHaveTextContent("DATABASE_URL");
		expect(figure).not.toHaveTextContent("$ arkenv check --json");
		expect(figure).not.toHaveClass("home-aurora__terminal");

		expect(
			screen.getByRole("button", { name: `Full message: ${HOST_MESSAGE}` }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: `Full message: ${PORT_MESSAGE}` }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Copy" }),
		).not.toBeInTheDocument();

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
	});

	it("opens the full issue message on tap/click of …", async () => {
		const user = userEvent.setup();
		render(<RuntimeBloatShowcase />);

		await user.click(
			screen.getByRole("button", { name: `Full message: ${HOST_MESSAGE}` }),
		);
		expect(await screen.findByText(HOST_MESSAGE)).toBeInTheDocument();
	});
});
