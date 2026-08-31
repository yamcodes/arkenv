import { Cpu } from "lucide-react";
import { WindowChrome } from "./window-chrome";

const BUNDLE_DATA = [
	{
		name: "@arkenv/standard",
		size: "1.5 kB",
		deps: "0 runtime deps",
		width: "12%",
		highlight: true,
	},
	{
		name: "@arkenv/core",
		size: "7.4 kB",
		deps: "peer arktype",
		width: "50%",
		highlight: false,
	},
	{
		name: "@t3-oss/env-core",
		size: "14.2 kB",
		deps: "zod + wrapper",
		width: "96%",
		highlight: false,
	},
];

/**
 * Performance & zero-runtime-bloat showcase with minimal telemetry bars.
 */
export function RuntimeBloatShowcase() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-bloat"
			id="runtime-bloat"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-bloat" data-reveal="blur">
					Zero runtime bloat
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					<code>@arkenv/standard</code> has zero external dependencies and a
					sub-2 kB footprint. Practically weightless on edge runtimes.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__telemetry"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="Production bundle impact and dependency comparison"
			>
				<WindowChrome
					title="bundle footprint (min+gzip)"
					icon={
						<Cpu
							className="home-aurora__telemetry-icon"
							size={13}
							aria-hidden="true"
						/>
					}
				/>

				<div className="home-aurora__telemetry-body">
					<div className="home-aurora__telemetry-list">
						{BUNDLE_DATA.map((item) => (
							<div
								key={item.name}
								className="home-aurora__telemetry-row"
								data-highlight={item.highlight ? "true" : undefined}
							>
								<div className="home-aurora__telemetry-label">
									<code className="home-aurora__telemetry-name">
										{item.name}
									</code>
									<span className="home-aurora__telemetry-deps">
										{item.deps}
									</span>
								</div>
								<div className="home-aurora__telemetry-track">
									<div
										className="home-aurora__telemetry-bar"
										style={{ width: item.width }}
									/>
									<span className="home-aurora__telemetry-size">
										{item.size}
									</span>
								</div>
							</div>
						))}
					</div>

					<div className="home-aurora__telemetry-footer">
						<span className="home-aurora__telemetry-stat">
							<strong>Boot overhead:</strong> &lt; 1 ms
						</span>
						<span className="home-aurora__telemetry-stat">
							<strong>Edge:</strong> Cloudflare &amp; Vercel ready
						</span>
					</div>
				</div>
			</figure>
		</section>
	);
}
