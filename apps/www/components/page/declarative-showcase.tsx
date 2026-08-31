const SRC_LINES = [
	{ text: "PORT=3000", animClass: "home-aurora__node-src--1" },
	{ text: "DEBUG=true", animClass: "home-aurora__node-src--2" },
	{ text: "LOG_LEVEL=debug", animClass: "home-aurora__node-src--3" },
];

const DEST_NODES = [
	{
		type: "number",
		example: "3000",
		animClass: "home-aurora__node-dest--1",
	},
	{
		type: "boolean",
		example: "true",
		animClass: "home-aurora__node-dest--2",
	},
	{
		type: '"debug" | "info"',
		example: '"debug"',
		animClass: "home-aurora__node-dest--3",
	},
];

/**
 * Automatic coercion showcase.
 * Hub-and-spoke node graph showing a monochromatic .env file document flowing into typed primitives and enums.
 */
export function DeclarativeShowcase() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-declarative"
			id="declarative"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-declarative" data-reveal="blur">
					Automatic coercion
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Turn raw environment strings into typed booleans, numbers, and
					enums automatically, without manual casting.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__node-widget"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="Node graph visualizing automatic type coercion from .env string input to typed primitives"
			>
				<div className="home-aurora__node-stage">
					{/* SVG Connector Beams */}
					<svg
						className="home-aurora__node-svg"
						viewBox="0 0 400 180"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<defs>
							<linearGradient
								id="beamGradient"
								x1="0%"
								y1="0%"
								x2="100%"
								y2="0%"
							>
								<stop offset="0%" stopColor="var(--color-rule)" />
								<stop offset="50%" stopColor="var(--color-accent)" />
								<stop offset="100%" stopColor="var(--color-accent)" />
							</linearGradient>
							<filter
								id="beamGlow"
								x="-20%"
								y="-20%"
								width="140%"
								height="140%"
							>
								<feGaussianBlur stdDeviation="3" result="blur" />
								<feComposite in="SourceGraphic" in2="blur" operator="over" />
							</filter>
						</defs>

						{/* Base Static Guide Tracks */}
						<path
							className="home-aurora__node-track"
							d="M 164 70 C 220 70, 230 40, 290 40"
						/>
						<path
							className="home-aurora__node-track"
							d="M 164 90 L 290 90"
						/>
						<path
							className="home-aurora__node-track"
							d="M 164 110 C 220 110, 230 140, 290 140"
						/>

						{/* Animated Glowing Laser Beams */}
						<path
							className="home-aurora__node-beam home-aurora__node-beam--1"
							d="M 164 70 C 220 70, 230 40, 290 40"
						/>
						<path
							className="home-aurora__node-beam home-aurora__node-beam--2"
							d="M 164 90 L 290 90"
						/>
						<path
							className="home-aurora__node-beam home-aurora__node-beam--3"
							d="M 164 110 C 220 110, 230 140, 290 140"
						/>
					</svg>

					{/* Source Node: .env Document File Sheet + Centered Caption */}
					<div className="home-aurora__node-source">
						<div className="home-aurora__node-source-wrapper">
							<div className="home-aurora__node-file-doc">
								{/* Pure SVG Document Outline & Folded Corner Flap */}
								<svg
									className="home-aurora__node-doc-bg"
									width="164"
									height="90"
									viewBox="0 0 164 90"
									aria-hidden="true"
								>
									<defs>
										<filter
											id="foldShadow"
											x="-40%"
											y="-40%"
											width="180%"
											height="180%"
										>
											<feDropShadow
												dx="-1.5"
												dy="1.5"
												stdDeviation="2"
												floodColor="#000"
												floodOpacity="0.75"
											/>
										</filter>
									</defs>

									{/* Document silhouette with diagonal top-right cut */}
									<path
										d="M 6 0 L 148 0 L 164 16 L 164 84 A 6 6 0 0 1 158 90 L 6 90 A 6 6 0 0 1 0 84 L 0 6 A 6 6 0 0 1 6 0 Z"
										className="home-aurora__node-doc-path"
									/>

									{/* Folded Flap Triangle */}
									<path
										d="M 148 0 L 148 16 L 164 16 Z"
										className="home-aurora__node-doc-flap"
										filter="url(#foldShadow)"
									/>
								</svg>

								<div className="home-aurora__node-file-content">
									{SRC_LINES.map((line) => (
										<div
											key={line.text}
											className={`home-aurora__node-file-line ${line.animClass}`}
										>
											<span className="home-aurora__node-file-raw">
												{line.text}
											</span>
											<span className="home-aurora__node-port home-aurora__node-port--right" />
										</div>
									))}
								</div>
							</div>
							<div className="home-aurora__node-file-caption">.env</div>
						</div>
					</div>

					{/* Destination Nodes: Primitives & Enum */}
					<div className="home-aurora__node-dest-group">
						{DEST_NODES.map((node) => (
							<div
								key={node.type}
								className={`home-aurora__node-dest-wrapper ${node.animClass}`}
							>
								<span className="home-aurora__node-port home-aurora__node-port--left" />
								<div className="home-aurora__node-card home-aurora__node-card--dest">
									<span className="home-aurora__node-type">{node.type}</span>
									<code className="home-aurora__node-val">{node.example}</code>
								</div>
							</div>
						))}
					</div>
				</div>
			</figure>
		</section>
	);
}
