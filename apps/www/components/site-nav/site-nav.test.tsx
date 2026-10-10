import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteNavAurora, SiteNavHome } from "./site-nav";

const { pathnameRef } = vi.hoisted(() => ({
	pathnameRef: { current: "/" },
}));

vi.mock("next/navigation", () => ({
	usePathname: () => pathnameRef.current,
}));

vi.mock("fumadocs-ui/contexts/search", () => ({
	useSearchContext: () => ({ setOpenSearch: vi.fn() }),
}));

describe("SiteNavAurora", () => {
	beforeEach(() => {
		pathnameRef.current = "/";
	});

	it("shows Get started on the homepage", () => {
		render(<SiteNavAurora releaseTag="" />);

		expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
			"href",
			"/docs/getting-started",
		);
		expect(
			screen.queryByRole("button", { name: "Open Search" }),
		).not.toBeInTheDocument();
	});

	it("shows Search on the roadmap, matching the blog", () => {
		pathnameRef.current = "/roadmap";
		render(<SiteNavAurora releaseTag="" />);

		expect(
			screen.getByRole("button", { name: "Open Search" }),
		).toBeInTheDocument();
		expect(screen.getByText("Search")).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Get started" }),
		).not.toBeInTheDocument();
	});
});

describe("SiteNavHome", () => {
	it("keeps Get started on orphan pages", () => {
		pathnameRef.current = "/roadmap";
		render(<SiteNavHome releaseTag="" />);

		expect(
			screen.getByRole("link", { name: "Get started" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Open Search" }),
		).not.toBeInTheDocument();
	});
});
