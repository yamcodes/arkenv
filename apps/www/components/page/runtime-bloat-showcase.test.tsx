import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { RuntimeBloatShowcase } from "./runtime-bloat-showcase";

describe("RuntimeBloatShowcase", () => {
	// Prevent window.location.search leaking between tests via replaceState.
	beforeEach(() => {
		window.history.replaceState(null, "", "/");
	});

	it("renders the heading and metric subtitle", () => {
		render(<RuntimeBloatShowcase />);

		expect(
			screen.getByRole("heading", { name: "Optimized for the edge" }),
		).toBeInTheDocument();

		expect(screen.getByText(/Minified, uncompressed JS/i)).toBeInTheDocument();
	});

	it("renders the 3 validator tabs with ArkType selected by default", () => {
		render(<RuntimeBloatShowcase />);

		const tablist = screen.getByRole("tablist", {
			name: /Validator comparison/i,
		});
		expect(tablist).toBeInTheDocument();

		const arkTypeTab = screen.getByRole("tab", { name: /ArkType/i });
		const zodTab = screen.getByRole("tab", { name: /Zod/i });
		const valibotTab = screen.getByRole("tab", { name: /Valibot/i });

		expect(arkTypeTab).toBeInTheDocument();
		expect(zodTab).toBeInTheDocument();
		expect(valibotTab).toBeInTheDocument();

		expect(arkTypeTab).toHaveAttribute("aria-selected", "true");
		expect(zodTab).toHaveAttribute("aria-selected", "false");
		expect(valibotTab).toHaveAttribute("aria-selected", "false");
	});

	it("renders the compound bar legend", () => {
		render(<RuntimeBloatShowcase />);

		expect(screen.getByText("Engine")).toBeInTheDocument();
		expect(screen.getByText("Validator extension")).toBeInTheDocument();
		expect(screen.getByText("All-in-one (for reference)")).toBeInTheDocument();
	});

	it("defaults to ArkType tab sorted by engine size with compound bars", () => {
		render(<RuntimeBloatShowcase />);

		const figure = screen.getByRole("figure", {
			name: /production runtime bundle size comparison/i,
		});

		// ArkEnv core bar
		expect(figure).toHaveTextContent("@arkenv/core");
		expect(figure).toHaveTextContent("+ ArkType");
		expect(figure).toHaveTextContent("156.0 kB");
		expect(figure).toHaveTextContent("(6.3 + 149.8)");

		// T3 Env bar with ArkType extension
		expect(figure).toHaveTextContent("@t3-oss/env-core");
		expect(figure).toHaveTextContent("+ ArkType");
		expect(figure).toHaveTextContent("164.0 kB");

		// Varlock reference bar
		expect(figure).toHaveTextContent("varlock");
		expect(figure).toHaveTextContent("(for reference)");
		expect(figure).toHaveTextContent("28.4 kB");
	});

	it("switches to Valibot tab, updates top bar to @arkenv/standard, and syncs URL", async () => {
		render(<RuntimeBloatShowcase />);

		const valibotTab = screen.getByRole("tab", { name: /Valibot/i });
		await userEvent.click(valibotTab);

		expect(window.location.search).toBe("?validator=valibot");

		const figure = screen.getByRole("figure", {
			name: /production runtime bundle size comparison/i,
		});

		// Shows @arkenv/standard with 23.3 kB total
		expect(figure).toHaveTextContent("@arkenv/standard");
		expect(figure).toHaveTextContent("+ Valibot");
		expect(figure).toHaveTextContent("23.3 kB");

		// T3 Env shows Valibot extension with 27.6 kB total
		expect(figure).toHaveTextContent("@t3-oss/env-core");
		expect(figure).toHaveTextContent("+ Valibot");
		expect(figure).toHaveTextContent("27.6 kB");
	});

	it("switches to Zod tab and back to ArkType clearing query string", async () => {
		render(<RuntimeBloatShowcase />);

		const zodTab = screen.getByRole("tab", { name: /Zod/i });
		await userEvent.click(zodTab);

		expect(window.location.search).toBe("?validator=zod");

		const figure = screen.getByRole("figure", {
			name: /production runtime bundle size comparison/i,
		});
		expect(figure).toHaveTextContent("@arkenv/standard");
		expect(figure).toHaveTextContent("+ Zod");
		expect(figure).toHaveTextContent("329.2 kB");

		// Switching back to default ArkType clears ?validator param
		const arkTypeTab = screen.getByRole("tab", { name: /ArkType/i });
		await userEvent.click(arkTypeTab);

		expect(window.location.search).toBe("");
		expect(figure).toHaveTextContent("@arkenv/core");
	});

	it("initializes to Valibot view when ?validator=valibot is in URL", () => {
		window.history.replaceState(null, "", "/?validator=valibot");
		render(<RuntimeBloatShowcase />);

		const figure = screen.getByRole("figure", {
			name: /production runtime bundle size comparison/i,
		});
		expect(figure).toHaveTextContent("@arkenv/standard");
		expect(figure).toHaveTextContent("+ Valibot");
		expect(figure).toHaveTextContent("23.3 kB");
	});

	it("renders accessible image labels on compound bar tracks", () => {
		render(<RuntimeBloatShowcase />);

		const images = screen.getAllByRole("img");
		expect(
			images.some((img) =>
				img
					.getAttribute("aria-label")
					?.includes("@arkenv/core engine at 6.3 kilobytes"),
			),
		).toBe(true);
	});

	it("renders npmx links and benchmark receipts link", () => {
		render(<RuntimeBloatShowcase />);

		const links = screen.getAllByRole("link");
		expect(
			links.some(
				(l) =>
					l.getAttribute("href") === "https://npmx.dev/package/@arkenv/core",
			),
		).toBe(true);
		expect(
			links.some(
				(l) => l.getAttribute("href") === "https://npmx.dev/package/varlock",
			),
		).toBe(true);

		const receipts = screen.getByRole("link", {
			name: /View benchmark script/i,
		});
		expect(receipts).toBeInTheDocument();
		expect(receipts).toHaveAttribute(
			"href",
			"https://github.com/yamcodes/arkenv/blob/v1/scripts/benchmark-bundle-size.ts",
		);
	});
});
