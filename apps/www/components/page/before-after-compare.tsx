"use client";

/**
 * Before / after code compare with a draggable vertical reveal.
 * Pure CSS clip + range input — no card chrome.
 */
export function BeforeAfterCompare() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-before-after"
			id="why"
		>
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label">01 — Friction</p>
				<h2 id="home-before-after">Delete the boilerplate</h2>
				<p>
					Manual <code>process.env</code> checks, throws, and{" "}
					<code>parseInt</code> coercion — or one schema.
				</p>
			</header>

			<div className="home-aurora__compare">
				<input
					type="range"
					min={8}
					max={92}
					defaultValue={50}
					aria-label="Reveal ArkEnv vs the old way"
					className="home-aurora__compare-range"
					onInput={(event) => {
						const value = `${(event.target as HTMLInputElement).value}%`;
						event.currentTarget.parentElement?.style.setProperty(
							"--compare",
							value,
						);
					}}
				/>
				<div className="home-aurora__compare-pane home-aurora__compare-pane--after">
					<p className="home-aurora__compare-eyebrow">The ArkEnv way</p>
					<pre className="home-aurora__code">
						<code>{`import arkenv from "arkenv";

export const env = arkenv({
  DATABASE_URL: "string.url",
  PORT: "0 <= number.integer <= 65535 = 3000",
  NODE_ENV: "'development' | 'production'",
});

// env.PORT is number — validated at boot`}</code>
					</pre>
				</div>
				<div className="home-aurora__compare-pane home-aurora__compare-pane--before">
					<p className="home-aurora__compare-eyebrow">The old way</p>
					<pre className="home-aurora__code">
						<code>{`const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

const portRaw = process.env.PORT ?? "3000";
const PORT = Number.parseInt(portRaw, 10);
if (Number.isNaN(PORT)) throw new Error("PORT invalid");

const NODE_ENV = process.env.NODE_ENV ?? "development";
if (!["development", "production"].includes(NODE_ENV)) {
  throw new Error("NODE_ENV invalid");
}

export const env = { DATABASE_URL: url, PORT, NODE_ENV };`}</code>
					</pre>
				</div>
				<div className="home-aurora__compare-handle" aria-hidden="true" />
			</div>
		</section>
	);
}
