"use client";

import { useState } from "react";
import { CompatibilityRails } from "~/components/page/compatibility-rails";

export function TerminalTabs() {
	const [active, setActive] = useState("schema");

	return (
		<div className="cli-term__window">
			<div className="cli-term__bar">
				<span className="cli-term__dot cli-term__dot--red" />
				<span className="cli-term__dot cli-term__dot--amber" />
				<span className="cli-term__dot cli-term__dot--green" />
			</div>
			<div className="cli-term__body">
				<nav className="cli-term__nav">
					{[
						{ id: "schema", num: "1", label: "Schema" },
						{ id: "validate", num: "2", label: "Validate" },
						{ id: "plugins", num: "3", label: "Plugins" },
					].map((tab) => (
						<button
							key={tab.id}
							type="button"
							className={`cli-term__tab${active === tab.id ? " is-active" : ""}`}
							onClick={() => setActive(tab.id)}
						>
							<span className="cli-term__num">{tab.num}</span>
							{tab.label}
						</button>
					))}
				</nav>
				<div className="cli-term__content">
					<div className={`cli-term__panel${active === "schema" ? " is-active" : ""}`}>
						<div className="cli-term__label">env.ts</div>
						<div className="cli-term__code">{`import arkenv from "arkenv";

const env = arkenv({
  PORT:       "number",
  API_KEY:    "string",
  DATABASE_URL: "string",
  NODE_ENV:   "'development' | 'production'",
});

// env.PORT is typed as number
// env.NODE_ENV is typed as "development" | "production"`}</div>
					</div>
					<div className={`cli-term__panel${active === "validate" ? " is-active" : ""}`}>
						<div className="cli-term__label">$ arkenv check</div>
						<div className="cli-term__code"><span className="cli-term__prompt">$</span> arkenv check
<span className="cli-term__dim">───────────────────</span>
<span className="cli-term__check">✓</span> API_URL is set <span className="cli-term__dim">(production)</span>
<span className="cli-term__check">✓</span> AUTH_SECRET is set <span className="cli-term__dim">(production)</span>
<span className="cli-term__check">✓</span> DATABASE_URL is set <span className="cli-term__dim">(production)</span>
<span className="cli-term__check">✓</span> NODE_ENV is <span className="cli-term__dim">&ldquo;production&rdquo;</span>
<span className="cli-term__dim">───────────────────</span>
<span className="cli-term__accent">All 12 variables resolved.</span></div>
					</div>
					<div className={`cli-term__panel${active === "plugins" ? " is-active" : ""}`}>
						<div className="cli-term__label">Project structure</div>
						<div className="cli-term__tree">
							<span className="folder">my-project/</span>
							<br />
							<span className="branch">├── </span><span className="folder">src/</span>
							<br />
							<span className="branch">│   └── </span><span className="file">env.ts</span>
							<br />
							<span className="branch">├── </span><span className="folder">.arkenv/</span>
							<br />
							<span className="branch">│   └── </span><span className="file">schema.lock</span>
							<br />
							<span className="branch">├── </span><span className="file">next.config.ts</span>
							<br />
							<span className="branch">└── </span><span className="file">package.json</span>
						</div>
						<div className="cli-term__label" style={{ marginTop: "var(--space-lg)" }}>
							Compatible frameworks
						</div>
						<CompatibilityRails className="max-w-full mx-0" />
					</div>
				</div>
			</div>
		</div>
	);
}
