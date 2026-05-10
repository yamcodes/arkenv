import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchToggle } from "./search-toggle";

vi.mock("fumadocs-ui/contexts/search", () => ({
	useSearchContext: () => ({
		setOpenSearch: vi.fn(),
	}),
}));

describe("SearchToggle", () => {
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it("shows Ctrl on non-Mac platforms", () => {
		vi.stubGlobal("navigator", {
			userAgent: "Windows NT 10.0",
		});

		render(<SearchToggle />);

		// It should stay as Ctrl
		const modifier = screen.getAllByText("Ctrl");
		expect(modifier.length).toBeGreaterThan(0);
	});

	it("shows ⌘ on Mac platforms", async () => {
		vi.stubGlobal("navigator", {
			userAgent: "Macintosh; Intel Mac OS X 10_15_7",
		});

		render(<SearchToggle />);

		// It should update to ⌘ after useEffect
		const modifier = await screen.findByText("⌘");
		expect(modifier).toBeInTheDocument();
	});

	it("shows ⌘ on iPad", async () => {
		vi.stubGlobal("navigator", {
			userAgent: "iPad; CPU OS 13_2_3 like Mac OS X",
		});

		render(<SearchToggle />);

		const modifier = await screen.findByText("⌘");
		expect(modifier).toBeInTheDocument();
	});
});
