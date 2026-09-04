import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FaqSection } from "./faq-section";

describe("FaqSection", () => {
	it("renders the exact FAQ title, concise intro, three graduation triggers, and migration link", () => {
		render(<FaqSection />);

		expect(
			screen.getByRole("heading", {
				name: "Why not just write a getEnv helper?",
			}),
		).toBeInTheDocument();

		expect(
			screen.getByText(
				"A 12-line presence check helper is completely sufficient when all of your environment variables are required strings.",
			),
		).toBeInTheDocument();

		expect(screen.getAllByText(/Booleans:/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/Numbers:/i).length).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText(/Client\/server splits:/i).length,
		).toBeGreaterThanOrEqual(1);

		const link = screen.getByRole("link", {
			name: /read the full getEnv migration guide/i,
		});
		expect(link).toHaveAttribute(
			"href",
			"/docs/guides/migrating-from-a-getenv-helper",
		);
	});
});
