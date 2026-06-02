"use client";

import { useState } from "react";

const commands: Record<string, string> = {
	npm: "npm install @arkenv/cli",
	pnpm: "pnpm add @arkenv/cli",
	bun: "bun add @arkenv/cli",
	curl: "curl -fsSL https://arkenv.js.org/install.sh | sh",
};

export function InstallTabs() {
	const [active, setActive] = useState("npm");

	return (
		<div className="cli-install" style={{ margin: "0 auto var(--space-lg)" }}>
			{(["npm", "pnpm", "bun", "curl"] as const).map((name) => (
				<button
					key={name}
					type="button"
					className={`cli-install__tab${active === name ? " is-active" : ""}`}
					onClick={() => setActive(name)}
				>
					{name}
				</button>
			))}
			<span className="cli-install__cmd">{commands[active]}</span>
			<button
				type="button"
				className="cli-install__copy"
				onClick={() => navigator.clipboard.writeText(commands[active])}
				aria-label="Copy install command"
			>
				<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
					<path d="M3 10.5V3C3 2.44772 3.44772 2 4 2H10.5" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			</button>
		</div>
	);
}
