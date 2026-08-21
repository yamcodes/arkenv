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

		const copy = screen.getByRole("button", { name: "Copy page" });
		const more = screen.getByRole("button", { name: "More page actions" });
		expect(copy).toBeInTheDocument();
		expect(more).toBeInTheDocument();
		expect(copy.className).toContain("rounded-l-sm");
		expect(more.className).toContain("rounded-r-sm");
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
			screen.getByRole("link", { name: "Edit on GitHub" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "View Markdown" }),
		).toBeInTheDocument();
		expect(
			screen
				.getByRole("button", { name: "Copy for LLM" })
				.compareDocumentPosition(
					screen.getByRole("button", { name: "View Markdown" }),
				) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: "View Markdown" })
				.compareDocumentPosition(
					screen.getByRole("link", { name: "Edit on GitHub" }),
				) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
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

	it("lays each desktop menu row out as icon, text, and trailing columns", async () => {
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

		const copyRow = screen.getByRole("button", {
			name: /Copy page as Markdown for LLMs/i,
		});
		expect(copyRow).toHaveAttribute("data-docs-ai-menu-row");
		expect(copyRow).toHaveStyle({
			display: "grid",
			gridTemplateColumns: "auto minmax(0, 1fr) auto",
		});
		expect(copyRow.children).toHaveLength(3);
		expect(copyRow.lastElementChild).toHaveAttribute(
			"data-docs-ai-menu-trailing",
		);
		expect(copyRow.lastElementChild).toHaveAttribute("aria-hidden", "true");
		expect(copyRow.lastElementChild).toHaveStyle({ visibility: "hidden" });
		expect(
			screen.getByRole("button", { name: /View as Markdown/i })
				.lastElementChild,
		).toHaveStyle({ visibility: "visible" });
		expect(screen.getByRole("link", { name: /Open in ChatGPT/i })).toHaveStyle({
			display: "grid",
			gridTemplateColumns: "auto minmax(0, 1fr) auto",
		});
	});

	it("closes the desktop menu after choosing Edit this page on GitHub", async () => {
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
		await user.click(
			screen.getByRole("link", { name: /Edit this page on GitHub/i }),
		);

		await waitFor(() => {
			expect(
				screen.queryByRole("link", { name: /Edit this page on GitHub/i }),
			).not.toBeInTheDocument();
		});
	});

	it("announces when copying the page fails", async () => {
		const user = userEvent.setup();
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				statusText: "Not Found",
			}),
		);

		render(
			<AIActions
				only="desktop"
				markdownUrl="/docs/missing.mdx"
				pageUrl="/docs/missing"
				githubUrl="https://github.com/yamcodes/arkenv"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Copy page" }));

		await waitFor(() => {
			expect(screen.getByText("Couldn't copy")).toBeInTheDocument();
		});
		expect(screen.getByText("Couldn't copy page")).toBeInTheDocument();
	});
});
