import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Heading } from "./heading";

// Mock the useIsMobile hook
vi.mock("../../hooks/use-is-mobile", () => ({
	useIsMobile: vi.fn(),
}));

describe("Heading", () => {
	it("renders without id when no id provided", () => {
		render(<Heading>Simple Heading</Heading>);
		const heading = screen.getByText("Simple Heading");
		expect(heading).toBeInTheDocument();
		expect(heading.tagName).toBe("H1");
	});

	it("renders with id and creates anchor link", () => {
		render(<Heading id="test-heading">Test Heading</Heading>);
		const heading = screen.getByText("Test Heading");
		expect(heading).toHaveAttribute("id", "test-heading");

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "#test-heading");
	});

	it("renders as different heading levels", () => {
		render(
			<Heading as="h2" id="test">
				H2 Heading
			</Heading>,
		);
		const heading = screen.getByText("H2 Heading");
		expect(heading.tagName).toBe("H2");
	});

	it("handles anchor click and scrolls to element", async () => {
		const user = userEvent.setup();
		const scrollIntoView = vi.fn();
		const mockElement = { scrollIntoView };
		vi.spyOn(document, "getElementById").mockReturnValue(
			mockElement as unknown as HTMLElement,
		);

		render(<Heading id="test-heading">Test Heading</Heading>);
		const link = screen.getByRole("link");

		await user.click(link);

		expect(scrollIntoView).toHaveBeenCalledWith({
			behavior: "smooth",
			block: "start",
		});
	});

	it("updates hash after scrolling", async () => {
		const user = userEvent.setup();
		const mockElement = { scrollIntoView: vi.fn() };
		vi.spyOn(document, "getElementById").mockReturnValue(
			mockElement as unknown as HTMLElement,
		);

		render(<Heading id="test-heading">Test Heading</Heading>);
		const link = screen.getByRole("link");

		await user.click(link);

		expect(window.location.hash).toBe("#test-heading");
	});

	it("accepts custom className", () => {
		render(
			<Heading id="test" className="custom-heading">
				Test
			</Heading>,
		);
		const heading = screen.getByText("Test");
		expect(heading).toHaveClass("custom-heading");
	});

	it("forwards additional props", () => {
		render(
			<Heading id="test" data-testid="test-heading">
				Test
			</Heading>,
		);
		const heading = screen.getByTestId("test-heading");
		expect(heading).toBeInTheDocument();
	});

	it("provides accessible anchor link", () => {
		render(<Heading id="test-heading">Test Heading</Heading>);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("aria-label", "Link to section: test-heading");
		expect(link).toHaveAttribute("href", "#test-heading");
	});
});
