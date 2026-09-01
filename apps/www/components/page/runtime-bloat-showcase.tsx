const BUNDLE_DATA = [
	{
		name: "@arkenv/standard",
		size: "1.5 kB",
		width: "8%",
		tier: "primary",
	},
	{
		name: "@arkenv/core",
		size: "7.4 kB",
		width: "28%",
		tier: "secondary",
	},
	{
		name: "@t3-oss/env-core",
		size: "14.2 kB",
		width: "52%",
		tier: "competitor",
	},
	{
		name: "varlock",
		size: "28.4 kB",
		width: "100%",
		tier: "competitor",
	},
];

/**
 * Performance & zero-runtime-bloat showcase with highlighted ArkEnv tiers
 * and muted dark neutral competitor bars.
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
					Optimized for the edge
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					50% smaller core than T3 Env. All engines under 10 kB for strict edge
					deployments.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__telemetry"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="Production runtime bundle size comparison"
			>
				<div className="home-aurora__telemetry-body">
					<div className="home-aurora__telemetry-list">
						{BUNDLE_DATA.map((item) => (
							<div
								key={item.name}
								className="home-aurora__telemetry-row"
								data-tier={item.tier}
							>
								<div className="home-aurora__telemetry-track">
									<div
										className="home-aurora__telemetry-bar"
										style={{ width: item.width }}
										aria-hidden="true"
									/>
									<a
										href={`https://npmx.dev/package/${item.name}`}
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
										{item.size}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</figure>
		</section>
	);
}
