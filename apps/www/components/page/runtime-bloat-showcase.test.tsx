import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuntimeBloatShowcase } from "./runtime-bloat-showcase";

describe("RuntimeBloatShowcase", () => {
	it("renders the Zero runtime bloat heading and bundle data", () => {
		render(<RuntimeBloatShowcase />);

		expect(
			screen.getByRole("heading", { name: "Zero runtime bloat" }),
		).toBeInTheDocument();

		const figure = screen.getByRole("figure", {
			name: /production bundle impact and dependency comparison/i,
		});
		expect(figure).toHaveTextContent("@arkenv/standard");
		expect(figure).toHaveTextContent("1.5 kB");
		expect(figure).toHaveTextContent("0 runtime deps");
		expect(figure).toHaveTextContent("@arkenv/core");
		expect(figure).toHaveTextContent("7.4 kB");
		expect(figure).toHaveTextContent("@t3-oss/env-core");
		expect(figure).toHaveTextContent("14.2 kB");
	});
});
