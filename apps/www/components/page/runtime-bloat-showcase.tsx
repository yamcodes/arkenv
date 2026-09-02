"use client";

import { useEffect, useState } from "react";
import benchmarkData from "~/lib/benchmark/benchmark.json";

type ViewMode = "full" | "adapter";

const VIEW_LABELS: Record<ViewMode, string> = {
	full: "Full edge payload",
	adapter: "Adapter engine only",
};

/**
 * "Optimized for the edge" bento cell: segmented toggle between two benchmark views.
 *
 * - **Full edge payload**: measures adapter + validator together (true V8 parse cost).
 * - **Adapter engine only**: measures pure wrapper footprint with peers externalized.
 *
 * Toggle state is stored in the URL query string (?view=adapter) so developers can
 * link directly to either view. State is synced with window.history.replaceState —
 * zero layout shift, zero navigation.
 */
export function RuntimeBloatShowcase() {
	const [view, setView] = useState<ViewMode>("full");

	// Sync from URL on mount (client-only: SSR always renders "full" for crawlers).
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const raw = params.get("view");
		if (raw === "adapter") setView("adapter");
	}, []);

	function switchView(next: ViewMode) {
		setView(next);
		const url = new URL(window.location.href);
		if (next === "adapter") {
			url.searchParams.set("view", "adapter");
		} else {
			url.searchParams.delete("view");
		}
		window.history.replaceState(null, "", url.toString());
	}

	const rows = benchmarkData[view];
	const maxBytes = Math.max(...rows.map((r) => r.bytes));

	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-bloat"
			id="runtime-bloat"
		>
			<header className="home-aurora__pitch-head">
				<div className="home-aurora__telemetry-heading-row">
					<div>
						<h2 id="home-bloat" data-reveal="blur">
							Optimized for the edge
						</h2>
						<p
							className="home-aurora__telemetry-subtitle"
							data-reveal
							style={{ ["--reveal-delay" as string]: "60ms" }}
						>
							Minified, uncompressed JS evaluated during V8 isolate cold starts.
						</p>
					</div>

					<div
						className="home-aurora__telemetry-toggle"
						data-reveal
						style={{ ["--reveal-delay" as string]: "80ms" }}
						role="group"
						aria-label="Benchmark view"
					>
						{(["full", "adapter"] as const).map((mode) => (
							<button
								key={mode}
								type="button"
								className="home-aurora__telemetry-toggle-btn"
								aria-pressed={view === mode}
								onClick={() => switchView(mode)}
							>
								{VIEW_LABELS[mode]}
							</button>
						))}
					</div>
				</div>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__telemetry"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="Production runtime bundle size comparison"
			>
				<div className="home-aurora__telemetry-body">
					<div className="home-aurora__telemetry-list">
						{rows.map((item) => {
							const widthPct = `${((item.bytes / maxBytes) * 100).toFixed(1)}%`;
							return (
								<div
									key={item.id}
									className="home-aurora__telemetry-row"
									data-tier={item.tier}
								>
									<div className="home-aurora__telemetry-track">
										<div
											className="home-aurora__telemetry-bar"
											style={{ width: widthPct }}
											aria-hidden="true"
										/>
										<a
											href={`https://npmx.dev/package/${item.name.replace(/ \+ .+$/, "")}`}
											target="_blank"
											rel="noopener noreferrer"
											className="home-aurora__telemetry-link"
											title={`View ${item.name} on npmx`}
										>
											<code className="home-aurora__telemetry-name">
												{item.name}
											</code>
										</a>
										<span className="home-aurora__telemetry-size">
											{item.kb} kB
										</span>
									</div>
								</div>
							);
						})}
					</div>

					<div className="home-aurora__telemetry-footer">
						esbuild · platform: neutral · target: es2022{" "}
						<span aria-hidden="true">·</span>{" "}
						<a
							href="https://github.com/yamcodes/arkenv/blob/v1/scripts/benchmark-bundle-size.ts"
							target="_blank"
							rel="noopener noreferrer"
						>
							View benchmark script ↗
						</a>
					</div>
				</div>
			</figure>
		</section>
	);
}

