import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AutocompleteShowcase } from "./autocomplete-showcase";

describe("AutocompleteShowcase", () => {
	it("shows an IDE with env autocomplete escaping the window", () => {
		render(<AutocompleteShowcase />);

		expect(
			screen.getByRole("heading", { name: "Autocomplete everywhere." }),
		).toBeInTheDocument();
		const workbench = screen.getByRole("img", {
			name: /vs code autocomplete on env/i,
		});
		expect(workbench).toHaveTextContent('import { env } from "./env"');
		expect(workbench).toHaveTextContent("const db = env.");
		expect(workbench).toHaveTextContent("DATABASE_URL");
		expect(workbench).toHaveTextContent("string");
		expect(workbench).not.toHaveTextContent("ArkEnvError");
		expect(workbench).not.toHaveTextContent("npm run dev");
		expect(workbench).not.toHaveClass("home-aurora__ide--light");
	});
});
