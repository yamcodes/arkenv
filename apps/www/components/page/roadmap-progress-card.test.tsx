import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapProgressCard } from "./roadmap-progress-card";

describe("RoadmapProgressCard", () => {
	it("links to /roadmap and shows the percent", () => {
		render(<RoadmapProgressCard percent={93.7} />);

		const link = screen.getByRole("link", {
			name: "v1 roadmap 94% complete",
		});
		expect(link).toHaveAttribute("href", "/roadmap");
		expect(screen.getByText("v1.0")).toBeInTheDocument();
		expect(screen.getByText("94%")).toBeInTheDocument();
	});
});
