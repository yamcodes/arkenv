import { env } from "@/env";
import { BetaBanner } from "./components/beta-banner";

export default function DashboardPage() {
	return (
		<main style={{ padding: "32px 28px", maxWidth: 720 }}>
			<h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
				Next.js ArkEnv S-Tier Prototype
			</h1>
			<p style={{ color: "#64748b", margin: "0 0 24px" }}>
				Server Component with virtualized <code>.arkenv/</code> artifact
				placement.
			</p>
			<section
				style={{
					padding: 20,
					background: "white",
					border: "1px solid #e2e8f0",
					borderRadius: 8,
				}}
			>
				<p style={{ margin: "0 0 8px" }}>
					<strong>Database:</strong> <code>{env.DATABASE_URL}</code>
				</p>
				<p style={{ margin: "0 0 8px" }}>
					<strong>Public API:</strong> <code>{env.NEXT_PUBLIC_API_URL}</code>
				</p>
				<p style={{ margin: 0 }}>
					<strong>Env:</strong> <code>{env.NODE_ENV}</code>
				</p>
			</section>

			<BetaBanner />

			<p style={{ marginTop: 20, fontSize: 14, color: "#64748b" }}>
				Billing is a Client Component that demonstrates secret protection.
			</p>
		</main>
	);
}
