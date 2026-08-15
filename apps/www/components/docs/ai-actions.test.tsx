import { AIActions } from "@arkenv/fumadocs-ui/components";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const markdown = "# Getting started\n\nHello.";

describe("AIActions", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				statusText: "OK",
				text: async () => markdown,
			}),
		);
	});

	it("renders a Copy page split button on desktop", () => {
		render(
			<AIActions
				only="desktop"
				markdownUrl="/docs/getting-started.mdx"
				pageUrl="/docs/getting-started"
				githubUrl="https://github.com/yamcodes/arkenv/edit/v1/apps/www/content/docs/getting-started.mdx"
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Copy page" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "More page actions" }),
		).toBeInTheDocument();
	});

	it("renders the inline Copy for LLM row on mobile", () => {
		render(
			<AIActions
				only="mobile"
				markdownUrl="/docs/getting-started.mdx"
				pageUrl="/docs/getting-started"
				githubUrl="https://github.com/yamcodes/arkenv/edit/v1/apps/www/content/docs/getting-started.mdx"
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Copy for LLM" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "View Markdown" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Edit on GitHub" }),
		).toBeInTheDocument();
	});

	it("copies page markdown to the clipboard", async () => {
		const user = userEvent.setup();
		render(
			<AIActions
				only="desktop"
				markdownUrl="/docs/getting-started.mdx"
				pageUrl="/docs/getting-started"
				githubUrl="https://github.com/yamcodes/arkenv"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Copy page" }));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith("/docs/getting-started.mdx");
			expect(screen.getByText("Copied")).toBeInTheDocument();
		});
		expect(screen.getByText("Page copied")).toBeInTheDocument();
	});

	it("lists markdown, chat, and GitHub actions in the desktop menu", async () => {
		const user = userEvent.setup();
		render(
			<AIActions
				only="desktop"
				markdownUrl="/docs/getting-started.mdx"
				pageUrl="/docs/getting-started"
				githubUrl="https://github.com/yamcodes/arkenv"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "More page actions" }));

		expect(
			screen.getByRole("button", { name: /View as Markdown/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Open in ChatGPT/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Open in Claude/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Open in Cursor/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Edit this page on GitHub/i }),
		).toHaveAttribute("href", "https://github.com/yamcodes/arkenv");
	});
});
