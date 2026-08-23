import { env } from "@/env";

export default function DashboardPage() {
	return (
		<main style={{ padding: "32px 28px", maxWidth: 720 }}>
			<h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Dashboard</h1>
			<p style={{ color: "#64748b", margin: "0 0 24px" }}>
				Server Component — secrets are allowed here.
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
			<p style={{ marginTop: 20, fontSize: 14, color: "#64748b" }}>
				Billing is a Client Component that copied the database read. Open it.
			</p>
		</main>
	);
}
