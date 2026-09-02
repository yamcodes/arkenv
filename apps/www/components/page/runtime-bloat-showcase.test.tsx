import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuntimeBloatShowcase } from "./runtime-bloat-showcase";

describe("RuntimeBloatShowcase", () => {
	it("renders the Optimized for the edge heading and comparison copy", () => {
		render(<RuntimeBloatShowcase />);

		expect(
			screen.getByRole("heading", { name: "Optimized for the edge" }),
		).toBeInTheDocument();

		expect(
			screen.getByText(/50% smaller core than T3 Env/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/All engines under 10 kB for strict edge deployments/i),
		).toBeInTheDocument();

		const figure = screen.getByRole("figure", {
			name: /production runtime bundle size comparison/i,
		});
		expect(figure).toHaveTextContent("@arkenv/standard");
		expect(figure).toHaveTextContent("1.5 kB");
		expect(figure).toHaveTextContent("@arkenv/core");
		expect(figure).toHaveTextContent("7.4 kB");
		expect(figure).toHaveTextContent("@t3-oss/env-core");
		expect(figure).toHaveTextContent("14.2 kB");
		expect(figure).toHaveTextContent("varlock");
		expect(figure).toHaveTextContent("28.4 kB");

		// Check npmx links
		const links = screen.getAllByRole("link");
		expect(
			links.some(
				(l) => l.getAttribute("href") === "https://npmx.dev/package/varlock",
			),
		).toBe(true);
		expect(
			links.some(
				(l) =>
					l.getAttribute("href") ===
					"https://npmx.dev/package/@arkenv/standard",
			),
		).toBe(true);
	});
});
