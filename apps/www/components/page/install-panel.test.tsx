import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InstallPanel } from "./install-panel";

describe("InstallPanel", () => {
	it("starts on For humans with the install command", () => {
		render(<InstallPanel />);

		expect(screen.getByRole("tab", { name: "For humans" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "For agents" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
		expect(
			screen.getByRole("button", { name: "Copy install command" }),
		).toHaveTextContent("npx arkenv@latest init");
		expect(
			screen.getByRole("button", { name: "Copy install command" }),
		).not.toHaveTextContent("--agent");
		expect(
			screen.queryByRole("button", { name: "Copy prompt" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "View repo" }),
		).not.toBeInTheDocument();
	});

	it("switches the pill to Copy prompt", async () => {
		const user = userEvent.setup();
		render(<InstallPanel />);

		await user.click(screen.getByRole("tab", { name: "For agents" }));

		expect(screen.getByRole("tab", { name: "For agents" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("button", { name: "Copy prompt" })).toHaveTextContent(
			"Copy prompt",
		);
		expect(
			screen.getByRole("button", { name: "Copy prompt" }),
		).not.toHaveTextContent("npx");
	});
});
