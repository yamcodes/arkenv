import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ArkenvSearchDialog from "./arkenv-search-dialog";

type SearchHit = { id: string; type: string; content: string };

const searchState = vi.hoisted(() => ({
	search: "",
	query: {
		isLoading: false,
		data: "empty" as "empty" | SearchHit[],
	},
}));

vi.mock("fumadocs-core/search/client", () => ({
	useDocsSearch: () => ({
		search: searchState.search,
		setSearch: vi.fn(),
		query: searchState.query,
	}),
}));

vi.mock("fumadocs-ui/contexts/i18n", () => ({
	useI18n: () => ({ locale: "en" }),
}));

vi.mock("fumadocs-ui/components/dialog/search", () => ({
	SearchDialog: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SearchDialogOverlay: () => <div data-testid="search-overlay" />,
	SearchDialogContent: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => (
		<div role="dialog" data-state="open" className={className}>
			{children}
		</div>
	),
	SearchDialogHeader: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	SearchDialogIcon: () => <span>icon</span>,
	SearchDialogInput: () => <input aria-label="Search" />,
	SearchDialogClose: () => (
		<button type="button" className="font-mono">
			ESC
		</button>
	),
	SearchDialogList: ({ items }: { items: SearchHit[] | null }) => (
		<div data-empty={items === null}>
			{items?.map((item) => (
				<div key={item.id}>{item.content}</div>
			))}
		</div>
	),
}));

describe("ArkenvSearchDialog", () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		searchState.search = "";
		searchState.query = { isLoading: false, data: "empty" };
	});

	it("uses a capsule radius while the results list is collapsed", () => {
		render(<ArkenvSearchDialog open onOpenChange={vi.fn()} />);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveClass("arkenv-search-dialog");
		expect(dialog).toHaveClass("rounded-full");
		expect(dialog).not.toHaveClass("rounded-2xl");
		expect(dialog.querySelector("[data-empty='true']")).toBeTruthy();
	});

	it("drops pill radius and shows result titles when matches are present", () => {
		searchState.search = "getting";
		searchState.query = {
			isLoading: false,
			data: [
				{
					id: "getting-started",
					type: "page",
					content: "Getting started",
				},
			],
		};

		render(<ArkenvSearchDialog open onOpenChange={vi.fn()} />);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveClass("arkenv-search-dialog");
		expect(dialog).toHaveClass("rounded-2xl");
		expect(dialog).not.toHaveClass("rounded-full");
		expect(dialog.querySelector("[data-empty='false']")).toBeTruthy();
		expect(screen.getByText("Getting started")).toBeInTheDocument();
	});

	it("keeps modest radius for an expanded empty-results panel", () => {
		searchState.search = "zzzz-no-match";
		searchState.query = { isLoading: false, data: [] };

		render(<ArkenvSearchDialog open onOpenChange={vi.fn()} />);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveClass("rounded-2xl");
		expect(dialog).not.toHaveClass("rounded-full");
		expect(dialog.querySelector("[data-empty='false']")).toBeTruthy();
	});
});
