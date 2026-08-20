import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HeroEnvHover } from "./hero-env-hover";
import { HeroPlaygroundProvider } from "./hero-playground";

const vanillaHover =
	'<code class="twoslash-popup-code"><span class="line">DATABASE_URL</span><span class="line">PORT</span></code>';
const viteHover =
	'<code class="twoslash-popup-code"><span class="line">VITE_API_URL</span></code>';

describe("HeroEnvHover", () => {
	it("wraps env in a twoslash hover trigger", () => {
		render(
			<HeroPlaygroundProvider>
				<HeroEnvHover
					hovers={[
						{
							host: "vanilla",
							validator: "arktype",
							html: vanillaHover,
						},
					]}
				/>
			</HeroPlaygroundProvider>,
		);

		const trigger = screen.getByRole("button", { name: "Example type of env" });
		expect(trigger).toHaveClass("twoslash-hover");
		expect(trigger).toHaveTextContent("env");
	});

	it("shows the Vanilla ArkType env shape by default", async () => {
		const user = userEvent.setup();
		render(
			<HeroPlaygroundProvider>
				<HeroEnvHover
					hovers={[
						{
							host: "vanilla",
							validator: "arktype",
							html: vanillaHover,
						},
						{ host: "vite", validator: "arktype", html: viteHover },
					]}
				/>
			</HeroPlaygroundProvider>,
		);

		await user.hover(
			screen.getByRole("button", { name: "Example type of env" }),
		);

		expect(await screen.findByText(/DATABASE_URL/)).toBeInTheDocument();
		expect(screen.getByText(/PORT/)).toBeInTheDocument();
		expect(screen.queryByText(/VITE_API_URL/)).not.toBeInTheDocument();
	});
});
