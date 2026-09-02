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

		expect(
			screen.getByText(/Minified, uncompressed JS/i),
		).toBeInTheDocument();
	});

	it("renders the toggle with two buttons", () => {
		render(<RuntimeBloatShowcase />);

		const group = screen.getByRole("group", { name: /Benchmark view/i });
		expect(group).toBeInTheDocument();

		expect(
			screen.getByRole("button", { name: /Full edge payload/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Adapter engine only/i }),
		).toBeInTheDocument();
	});

	it("defaults to full view showing real payload sizes", () => {
		render(<RuntimeBloatShowcase />);

		const figure = screen.getByRole("figure", {
			name: /production runtime bundle size comparison/i,
		});

		// Full view: combined ecosystem entries
		expect(figure).toHaveTextContent("@arkenv/standard + Valibot");
		expect(figure).toHaveTextContent("23.3 kB");
		expect(figure).toHaveTextContent("@arkenv/core + ArkType");
		expect(figure).toHaveTextContent("156.0 kB");
		expect(figure).toHaveTextContent("@t3-oss/env-core + Zod");
		expect(figure).toHaveTextContent("325.0 kB");
		expect(figure).toHaveTextContent("varlock");
		expect(figure).toHaveTextContent("28.4 kB");
	});

	it("switches to adapter-only view when toggle is clicked", async () => {
		render(<RuntimeBloatShowcase />);

		const adapterBtn = screen.getByRole("button", {
			name: /Adapter engine only/i,
		});
		await userEvent.click(adapterBtn);

		const figure = screen.getByRole("figure", {
			name: /production runtime bundle size comparison/i,
		});
		expect(figure).toHaveTextContent("@arkenv/standard");
		expect(figure).toHaveTextContent("10.0 kB");
		expect(figure).toHaveTextContent("@arkenv/core");
		expect(figure).toHaveTextContent("6.3 kB");
		expect(figure).toHaveTextContent("@t3-oss/env-core");
		expect(figure).toHaveTextContent("14.2 kB");

		// Should NOT show full-payload combined names in adapter view
		expect(figure).not.toHaveTextContent("+ ArkType");
		expect(figure).not.toHaveTextContent("+ Zod");
	});

	it("renders npmx link for the package base name", () => {
		render(<RuntimeBloatShowcase />);

		const links = screen.getAllByRole("link");
		expect(
			links.some(
				(l) =>
					l.getAttribute("href") === "https://npmx.dev/package/@arkenv/standard",
			),
		).toBe(true);
		expect(
			links.some(
				(l) => l.getAttribute("href") === "https://npmx.dev/package/varlock",
			),
		).toBe(true);
	});

	it("renders the benchmark receipts link", () => {
		render(<RuntimeBloatShowcase />);

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
