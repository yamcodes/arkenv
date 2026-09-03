import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuntimeBloatShowcase } from "./runtime-bloat-showcase";

describe("RuntimeBloatShowcase", () => {
	it("renders the heading and metric subtitle", () => {
		render(<RuntimeBloatShowcase />);

		expect(
			screen.getByRole("heading", { name: "Optimized for the edge" }),
		).toBeInTheDocument();

		expect(screen.getByText(/Minified, uncompressed JS/i)).toBeInTheDocument();
	});

	it("renders the compound bar legend", () => {
		render(<RuntimeBloatShowcase />);

		expect(screen.getByText("Engine")).toBeInTheDocument();
		expect(screen.getByText("Validator")).toBeInTheDocument();
		expect(screen.getByText("Both")).toBeInTheDocument();
	});

	it("renders all four real-world edge stacks simultaneously in ascending order", () => {
		render(<RuntimeBloatShowcase />);

		const list = screen.getByRole("region", {
			name: "Production runtime bundle size comparison leaderboard",
		});
		expect(list).toBeInTheDocument();

		const rows = list.querySelectorAll(".home-aurora__telemetry-row");
		expect(rows).toHaveLength(4);

		// 1. ArkEnv + Valibot (23.3 kB)
		const row0 = within(rows[0] as HTMLElement);
		expect(row0.getByText("ArkEnv")).toBeInTheDocument();
		expect(row0.getByText("+ Valibot")).toBeInTheDocument();
		expect(row0.getByText("23.3 kB")).toBeInTheDocument();
		expect(row0.queryByText("(10.0 + 13.4)")).not.toBeInTheDocument();

		// 2. Varlock (28.4 kB)
		const row1 = within(rows[1] as HTMLElement);
		expect(row1.getByText("Varlock")).toBeInTheDocument();
		expect(row1.getByText("28.4 kB")).toBeInTheDocument();

		// 3. ArkEnv + ArkType (156.0 kB)
		const row2 = within(rows[2] as HTMLElement);
		expect(row2.getByText("ArkEnv")).toBeInTheDocument();
		expect(row2.getByText("+ ArkType")).toBeInTheDocument();
		expect(row2.getByText("156.0 kB")).toBeInTheDocument();
		expect(row2.queryByText("(6.3 + 149.8)")).not.toBeInTheDocument();

		// 4. T3 Env + Zod (325.0 kB)
		const row3 = within(rows[3] as HTMLElement);
		expect(row3.getByText("T3 Env")).toBeInTheDocument();
		expect(row3.getByText("+ Zod")).toBeInTheDocument();
		expect(row3.getByText("325.0 kB")).toBeInTheDocument();
		expect(row3.queryByText("(14.2 + 310.8)")).not.toBeInTheDocument();
	});

	it("renders accessible image labels on compound bar tracks", () => {
		render(<RuntimeBloatShowcase />);

		const images = screen.getAllByRole("img");
		expect(images).toHaveLength(4);

		expect(images[0]?.getAttribute("aria-label")).toBe(
			"ArkEnv engine at 10.0 kilobytes, plus Valibot extension at 13.4 kilobytes, total 23.3 kilobytes",
		);
		expect(images[1]?.getAttribute("aria-label")).toBe(
			"Varlock engine at 28.4 kilobytes, total 28.4 kilobytes",
		);
		expect(images[2]?.getAttribute("aria-label")).toBe(
			"ArkEnv engine at 6.3 kilobytes, plus ArkType extension at 149.8 kilobytes, total 156.0 kilobytes",
		);
		expect(images[3]?.getAttribute("aria-label")).toBe(
			"T3 Env engine at 14.2 kilobytes, plus Zod extension at 310.8 kilobytes, total 325.0 kilobytes",
		);
	});

	it("renders npmx links and benchmark source link", () => {
		render(<RuntimeBloatShowcase />);

		const links = screen.getAllByRole("link");
		expect(
			links.some(
				(l) =>
					l.getAttribute("href") ===
					"https://npmx.dev/package/@arkenv/standard",
			),
		).toBe(true);
		expect(
			links.some(
				(l) =>
					l.getAttribute("href") === "https://npmx.dev/package/@arkenv/core",
			),
		).toBe(true);
		expect(
			links.some(
				(l) => l.getAttribute("href") === "https://npmx.dev/package/varlock",
			),
		).toBe(true);
		expect(
			links.some(
				(l) =>
					l.getAttribute("href") ===
					"https://npmx.dev/package/@t3-oss/env-core",
			),
		).toBe(true);
		expect(
			links.some(
				(l) => l.getAttribute("href") === "https://npmx.dev/package/valibot",
			),
		).toBe(true);
		expect(
			links.some(
				(l) => l.getAttribute("href") === "https://npmx.dev/package/arktype",
			),
		).toBe(true);
		expect(
			links.some(
				(l) => l.getAttribute("href") === "https://npmx.dev/package/zod",
			),
		).toBe(true);

		const source = screen.getByRole("link", {
			name: /Source/i,
		});
		expect(source).toBeInTheDocument();
		expect(source).toHaveAttribute(
			"href",
			"https://github.com/yamcodes/arkenv/blob/v1/scripts/benchmark-bundle-size.ts",
		);
	});
});
