import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getGithubRepoUrl } from "~/lib/github-links";
import { InstallPanel } from "./install-panel";

describe("InstallPanel", () => {
	it("shows the command pill with 1-click prompt and GitHub actions", () => {
		render(<InstallPanel />);

		expect(
			screen.getByRole("button", { name: "Copy install command" }),
		).toHaveTextContent("npx arkenv@latest init");
		expect(
			screen.getByRole("button", { name: "Copy prompt" }),
		).toBeVisible();
		const repo = screen.getByRole("link", { name: "View repo" });
		expect(repo).toBeVisible();
		expect(repo).toHaveAttribute("href", getGithubRepoUrl());
		expect(
			screen.queryByRole("link", { name: "Read docs" }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("tab")).not.toBeInTheDocument();
	});

	it("puts Copy prompt and Read docs on the outro sub-row", () => {
		render(<InstallPanel variant="outro" />);

		expect(
			screen.getByRole("button", { name: "Copy prompt" }),
		).toBeVisible();
		expect(screen.getByRole("link", { name: "Read docs" })).toHaveAttribute(
			"href",
			"/docs",
		);
		expect(
			screen.queryByRole("link", { name: "View repo" }),
		).not.toBeInTheDocument();
	});
});
