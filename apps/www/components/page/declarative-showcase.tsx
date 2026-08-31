interface StreamRow {
	id: string;
	key: string;
	val: string;
	schema: string;
	primitive: string;
}

const STREAM_ROWS: StreamRow[] = [
	{
		id: "port",
		key: "PORT=",
		val: "3000",
		schema: '"number"',
		primitive: "3000",
	},
	{
		id: "debug",
		key: "DEBUG=",
		val: "false",
		schema: '"boolean"',
		primitive: "false",
	},
];

/**
 * Automatic coercion showcase.
 * Minimalist typographic stream: Raw .env -> Schema Token -> Typed Primitive.
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
				className="home-aurora__pitch-visual home-aurora__stream-widget"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="Minimalist data stream showing raw environment strings transformed into typed primitives"
			>
				<div className="home-aurora__stream-stage">
					{STREAM_ROWS.map((row) => (
						<div
							key={row.id}
							className={`home-aurora__stream-row home-aurora__stream-row--${row.id}`}
						>
							{/* Column 1: Raw .env input */}
							<div className="home-aurora__stream-col home-aurora__stream-col--left">
								<span className="home-aurora__stream-key">{row.key}</span>
								<code className="home-aurora__stream-raw">{row.val}</code>
							</div>

							{/* Wire 1: Left to Center */}
							<div className="home-aurora__stream-wire" aria-hidden="true">
								<svg
									className="home-aurora__stream-wire-svg"
									viewBox="0 0 100 20"
									preserveAspectRatio="none"
								>
									<line
										x1="0"
										y1="10"
										x2="100"
										y2="10"
										className="home-aurora__stream-wire-track"
									/>
									<circle
										cx="0"
										cy="10"
										r="2.5"
										className="home-aurora__stream-wire-dot home-aurora__stream-wire-dot--1"
									/>
								</svg>
							</div>

							{/* Column 2: Naked Schema Token */}
							<div className="home-aurora__stream-gate">
								<code className="home-aurora__stream-schema">
									{row.schema}
								</code>
							</div>

							{/* Wire 2: Center to Right */}
							<div className="home-aurora__stream-wire" aria-hidden="true">
								<svg
									className="home-aurora__stream-wire-svg"
									viewBox="0 0 100 20"
									preserveAspectRatio="none"
								>
									<line
										x1="0"
										y1="10"
										x2="92"
										y2="10"
										className="home-aurora__stream-wire-track"
									/>
									<polygon
										points="90,7 98,10 90,13"
										className="home-aurora__stream-arrow"
									/>
									<circle
										cx="0"
										cy="10"
										r="2.5"
										className="home-aurora__stream-wire-dot home-aurora__stream-wire-dot--2"
									/>
								</svg>
							</div>

							{/* Column 3: Inferred primitive */}
							<div className="home-aurora__stream-col home-aurora__stream-col--right">
								<code className="home-aurora__stream-prim">
									{row.primitive}
								</code>
							</div>
						</div>
					))}
				</div>
			</figure>
		</section>
	);
}
