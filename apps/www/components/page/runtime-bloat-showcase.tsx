import benchmarkDataRaw from "~/lib/benchmark/benchmark.json";
import type { BenchmarkData } from "~/lib/benchmark/types";

const benchmarkData = benchmarkDataRaw as BenchmarkData;

/**
 * "Optimized for the edge" leaderboard: pkg-size-style compound bar chart comparing
 * the four most common real-world edge validation stacks, sorted ascending by total
 * uncompressed parse weight.
 *
 * 1. @arkenv/standard + Valibot (23.3 kB) — ultra-lightweight strict edge champion
 * 2. varlock (28.4 kB) — standalone reference baseline
 * 3. @arkenv/core + ArkType (156.0 kB) — full-power JIT-compiled TypeScript DSL
 * 4. @t3-oss/env-core + Zod (325.0 kB) — monolithic status quo
 *
 * Pure React Server Component: zero client-side JavaScript, prerendered at build time.
 */
export function RuntimeBloatShowcase() {
	const rows = benchmarkData.leaderboard;
	const maxBytes = Math.max(...rows.map((r) => r.totalBytes));

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
				<p
					className="home-aurora__telemetry-subtitle"
					data-reveal
					style={{ ["--reveal-delay" as string]: "60ms" }}
				>
					Minified, uncompressed JS evaluated during V8 isolate cold starts.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__telemetry"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="Production runtime bundle size comparison"
			>
				<div className="home-aurora__telemetry-body">
					<div className="home-aurora__telemetry-legend" aria-hidden="true">
						<span className="home-aurora__telemetry-legend-item">
							<span className="home-aurora__telemetry-swatch home-aurora__telemetry-swatch--engine" />
							Engine
						</span>
						<span className="home-aurora__telemetry-legend-item">
							<span className="home-aurora__telemetry-swatch home-aurora__telemetry-swatch--validator" />
							Validator extension
						</span>
						<span className="home-aurora__telemetry-legend-item">
							<span className="home-aurora__telemetry-swatch home-aurora__telemetry-swatch--reference" />
							All-in-one (for reference)
						</span>
					</div>

					<section
						id="benchmark-telemetry-list"
						className="home-aurora__telemetry-list"
						aria-label="Production runtime bundle size comparison leaderboard"
					>
						{rows.map((item) => {
							const totalPct = `${((item.totalBytes / maxBytes) * 100).toFixed(1)}%`;
							const engineShare = `${((item.engineBytes / item.totalBytes) * 100).toFixed(1)}%`;
							const validatorShare = item.validatorBytes
								? `${((item.validatorBytes / item.totalBytes) * 100).toFixed(1)}%`
								: "0%";

							const a11yLabel = `${item.name} engine at ${item.engineKb} kilobytes${
								item.validatorName
									? `, plus ${item.validatorName} extension at ${item.validatorKb} kilobytes`
									: ""
							}, total ${item.totalKb} kilobytes`;

							return (
								<div
									key={item.id}
									className="home-aurora__telemetry-row"
									data-tier={item.tier}
								>
									<div className="home-aurora__telemetry-track">
										<div
											className="home-aurora__telemetry-bar-group"
											style={{ width: totalPct }}
											role="img"
											aria-label={a11yLabel}
										>
											<div
												className="home-aurora__telemetry-segment home-aurora__telemetry-segment--engine"
												style={{ width: engineShare }}
												title={`${item.name} engine: ${item.engineKb} kB (${item.engineGzipKb} kB gzip)`}
											/>
											{item.validatorBytes ? (
												<div
													className="home-aurora__telemetry-segment home-aurora__telemetry-segment--validator"
													style={{ width: validatorShare }}
													title={`${item.validatorName} extension: ${item.validatorKb} kB (${item.validatorGzipKb} kB gzip)`}
												/>
											) : null}
										</div>

										<div className="home-aurora__telemetry-content">
											<div className="home-aurora__telemetry-meta">
												<a
													href={`https://npmx.dev/package/${item.npmPackage}`}
													target="_blank"
													rel="noopener noreferrer"
													className="home-aurora__telemetry-link"
													title={`View ${item.npmPackage} on npmx`}
												>
													<code className="home-aurora__telemetry-name">
														{item.name}
													</code>
												</a>
												{item.validatorName ? (
													<span className="home-aurora__telemetry-ext">
														+ {item.validatorName}
													</span>
												) : null}
												{item.note ? (
													<span className="home-aurora__telemetry-note">
														({item.note})
													</span>
												) : null}
											</div>

											<div
												className="home-aurora__telemetry-stats"
												title={`Total: ${item.totalKb} kB uncompressed (${item.totalGzipKb} kB gzip)`}
											>
												<span className="home-aurora__telemetry-size">
													{item.totalKb} kB
												</span>
												{item.validatorBytes ? (
													<span className="home-aurora__telemetry-breakdown">
														({item.engineKb} + {item.validatorKb})
													</span>
												) : null}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</section>

					<div className="home-aurora__telemetry-footer">
						ArkEnv built via esbuild · platform: neutral · target: es2022{" "}
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
