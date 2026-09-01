import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RELEASE_CONFIG } from "~/lib/config/release";
import { getGithubRepoUrl } from "~/lib/github-links";
import { InstallPanel } from "./install-panel";

describe("InstallPanel", () => {
	let writeTextMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		writeTextMock = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", {
			clipboard: {
				writeText: writeTextMock,
			},
		});
	});

	it("shows the command pill with 1-click prompt and GitHub actions", () => {
		render(<InstallPanel />);

		expect(
			screen.getByRole("button", { name: "Copy install command" }),
		).toHaveTextContent(RELEASE_CONFIG.initCommand);
		expect(screen.getByRole("button", { name: "Copy prompt" })).toBeVisible();
		const repo = screen.getByRole("link", { name: "View repo" });
		expect(repo).toBeVisible();
		expect(repo).toHaveAttribute("href", getGithubRepoUrl());
		expect(
			screen.queryByRole("link", { name: "Read the docs" }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("tab")).not.toBeInTheDocument();
	});

	it("copies active release command when clicking install command pill", () => {
		render(<InstallPanel />);

		const button = screen.getByRole("button", {
			name: "Copy install command",
		});
		fireEvent.click(button);

		expect(writeTextMock).toHaveBeenCalledWith(RELEASE_CONFIG.initCommand);
	});

	it("copies active release agent prompt when clicking Copy prompt", () => {
		render(<InstallPanel />);

		const promptButton = screen.getByRole("button", { name: "Copy prompt" });
		fireEvent.click(promptButton);

		expect(writeTextMock).toHaveBeenCalledWith(RELEASE_CONFIG.agentPrompt);
	});

	it("puts Copy prompt and Read the docs on the outro sub-row", () => {
		render(<InstallPanel variant="outro" />);

		expect(screen.getByRole("button", { name: "Copy prompt" })).toBeVisible();
		expect(screen.getByRole("link", { name: "Read the docs" })).toHaveAttribute(
			"href",
			"/docs",
		);
		expect(
			screen.queryByRole("link", { name: "View repo" }),
		).not.toBeInTheDocument();
	});
});
