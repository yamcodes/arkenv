import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getGithubRepoUrl } from "~/lib/github-links";
import { InstallPanel } from "./install-panel";

describe("InstallPanel", () => {
	it("shows the command pill, copy-prompt, and view-repo actions", () => {
		render(<InstallPanel />);

		expect(
			screen.getByRole("button", { name: "Copy install command" }),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Copy agent prompt" }),
		).toBeVisible();
		const repo = screen.getByRole("link", { name: "View repo" });
		expect(repo).toBeVisible();
		expect(repo).toHaveAttribute("href", getGithubRepoUrl());
		expect(screen.queryByRole("tab")).not.toBeInTheDocument();
	});
});
