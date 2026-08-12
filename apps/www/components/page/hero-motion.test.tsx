import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroMotion, resetHeroMotion } from "./hero-motion";

function Harness({ label = "Hero" }: { label?: string }) {
	return (
		<div className="home-aurora">
			<HeroMotion />
			<h1 className="rise-blur">{label}</h1>
			<p className="rise">Summary</p>
		</div>
	);
}

async function flushPlay() {
	await act(async () => {
		vi.advanceTimersByTime(50);
	});
}

describe("HeroMotion", () => {
	beforeEach(() => {
		resetHeroMotion();
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
		resetHeroMotion();
	});

	it("stamps the rise nodes that exist when play starts", async () => {
		render(<Harness />);
		await flushPlay();

		const root = document.querySelector(".home-aurora");
		expect(root).toHaveAttribute("data-hero-motion", "play");
		expect(root?.querySelector(".rise-blur")).toHaveAttribute("data-hero-run");
		expect(root?.querySelector(".rise")).toHaveAttribute("data-hero-run");
	});

	it("does not restart the entrance when HomeLayout replaces rise nodes", async () => {
		render(<Harness />);
		await flushPlay();

		const root = document.querySelector(".home-aurora");
		expect(root).toHaveAttribute("data-hero-motion", "play");

		const nextHeading = document.createElement("h1");
		nextHeading.className = "rise-blur";
		nextHeading.textContent = "Replaced";
		root?.querySelector(".rise-blur")?.replaceWith(nextHeading);

		await act(async () => {
			vi.advanceTimersByTime(50);
		});

		expect(nextHeading).not.toHaveAttribute("data-hero-run");
		expect(root).toHaveAttribute("data-hero-motion", "play");
	});

	it("settles to done instead of replaying after a late remount", async () => {
		const first = render(<Harness label="First" />);
		await flushPlay();
		first.unmount();

		render(<Harness label="Second" />);
		await flushPlay();

		const root = document.querySelector(".home-aurora");
		expect(root).toHaveAttribute("data-hero-motion", "done");
		expect(root?.querySelector(".rise-blur")).not.toHaveAttribute(
			"data-hero-run",
		);
	});
});
