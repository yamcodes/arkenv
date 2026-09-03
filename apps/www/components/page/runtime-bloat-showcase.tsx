import benchmarkDataRaw from "~/lib/benchmark/benchmark.json";
import type { BenchmarkData } from "~/lib/benchmark/types";

const benchmarkData = benchmarkDataRaw as BenchmarkData;

/**
 * "Optimized for the edge" leaderboard: pkg-size-style compound bar chart comparing
 * the four most common real-world edge validation stacks, sorted ascending by total
 * uncompressed parse weight.
 *
 * 1. ArkEnv + Valibot (23.3 kB) — ultra-lightweight strict edge champion
 * 2. Varlock (28.4 kB) — standalone reference baseline
 * 3. ArkEnv + ArkType (156.0 kB) — full-power JIT-compiled TypeScript DSL
 * 4. T3 Env + Zod (325.0 kB) — monolithic status quo
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

							const statsTooltip = `Total: ${item.totalKb} kB (${item.totalGzipKb} kB gzipped)`;

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
												title={`${item.name}: ${item.engineKb} kB (${item.engineGzipKb} kB gzipped)`}
											/>
											{item.validatorBytes ? (
												<div
													className="home-aurora__telemetry-segment home-aurora__telemetry-segment--validator"
													style={{ width: validatorShare }}
													title={`${item.validatorName}: ${item.validatorKb} kB (${item.validatorGzipKb} kB gzipped)`}
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
												{item.validatorName && item.validatorPackage ? (
													<>
														<span
															className="home-aurora__telemetry-plus"
															aria-hidden="true"
														>
															+
														</span>
														<a
															href={`https://npmx.dev/package/${item.validatorPackage}`}
															target="_blank"
															rel="noopener noreferrer"
															className="home-aurora__telemetry-link home-aurora__telemetry-ext"
															title={`View ${item.validatorPackage} on npmx`}
														>
															{item.validatorName}
														</a>
													</>
												) : null}
											</div>

											<div
												className="home-aurora__telemetry-stats"
												title={statsTooltip}
											>
												<span className="home-aurora__telemetry-size">
													{item.totalKb} kB
												</span>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</section>

					<div className="home-aurora__telemetry-footer">
						<div className="home-aurora__telemetry-legend" aria-hidden="true">
							<span className="home-aurora__telemetry-legend-item">
								<span className="home-aurora__telemetry-swatch home-aurora__telemetry-swatch--engine" />
								Engine
							</span>
							<span className="home-aurora__telemetry-legend-item">
								<span className="home-aurora__telemetry-swatch home-aurora__telemetry-swatch--validator" />
								Validator
							</span>
							<span className="home-aurora__telemetry-legend-item">
								<span className="home-aurora__telemetry-swatch home-aurora__telemetry-swatch--reference" />
								Both
							</span>
						</div>

						<a
							href="https://github.com/yamcodes/arkenv/blob/v1/scripts/benchmark-bundle-size.ts"
							target="_blank"
							rel="noopener noreferrer"
							className="home-aurora__telemetry-source"
						>
							Source ↗
						</a>
					</div>
				</div>
			</figure>
		</section>
	);
}
