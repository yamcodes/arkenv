import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AutocompleteShowcase } from "./autocomplete-showcase";

describe("AutocompleteShowcase", () => {
	it("shows an IDE with env autocomplete inside the window", () => {
		render(<AutocompleteShowcase />);

		expect(
			screen.getByRole("heading", { name: "Strictly typed" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/single source of truth/i).closest("p"),
		).toHaveTextContent(
			"Strict type inference without glue code. Your schema is the single source of truth.",
		);
		const workbench = screen.getByRole("figure", {
			name: /vs code autocomplete on env/i,
		});
		expect(workbench).toHaveTextContent('import { env } from "./env"');
		expect(workbench).toHaveTextContent("const db = env.");
		expect(workbench).toHaveTextContent("const port = env.PORT");
		expect(workbench).toHaveTextContent("DATABASE_URL");
		expect(workbench).toHaveTextContent("string");
		expect(workbench).not.toHaveTextContent("ArkEnvError");
		expect(workbench).not.toHaveTextContent("npm run dev");
		expect(workbench).not.toHaveClass("home-aurora__ide--light");
		expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
	});
});
