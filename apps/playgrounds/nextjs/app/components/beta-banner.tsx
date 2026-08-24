"use client";

import { isEnabled } from "@arkenv/nextjs";
import type { Env } from "../../env";

export function BetaBanner() {
	// Demonstrates compile-time dead-code elimination (DCE):
	// Next.js compiler inlines process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURE -> "false"
	// Minifier evaluates `isEnabled<Env>("...", "false")` -> ("false" === "true") -> false
	// and completely eliminates this branch from the client bundle!
	if (
		isEnabled<Env>(
			"NEXT_PUBLIC_ENABLE_BETA_FEATURE",
			process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURE,
		)
	) {
		return (
			<div
				style={{
					padding: "12px 16px",
					marginTop: 16,
					background: "#ecfdf5",
					border: "1px solid #10b981",
					borderRadius: 6,
					color: "#065f46",
				}}
			>
				✨ <strong>Beta Feature Enabled:</strong> You are viewing the new S-Tier
				Next.js ArkEnv architecture!
			</div>
		);
	}

	return (
		<div
			style={{
				padding: "12px 16px",
				marginTop: 16,
				background: "#f8fafc",
				border: "1px dashed #cbd5e1",
				borderRadius: 6,
				color: "#64748b",
				fontSize: 13,
			}}
		>
			ℹ️ Beta feature branch was statically pruned by minifier DCE (flag is
			false).
		</div>
	);
}
