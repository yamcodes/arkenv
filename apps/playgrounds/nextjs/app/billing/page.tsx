import { ConnectionStatus } from "../components/connection-status";
import { env } from "@/env";

export default function BillingPage() {
	return (
		<main style={{ padding: "32px 28px", maxWidth: 720 }}>
			<h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Billing</h1>
			<p style={{ color: "#64748b", margin: "0 0 24px" }}>
				Customer portal. Public API is fine on the client; the status pill
				below is not.
			</p>
			<section
				style={{
					padding: 20,
					background: "white",
					border: "1px solid #e2e8f0",
					borderRadius: 8,
				}}
			>
				<p style={{ margin: "0 0 12px" }}>
					<strong>Checkout API:</strong> <code>{env.NEXT_PUBLIC_API_URL}</code>
				</p>
				<ConnectionStatus />
			</section>
		</main>
	);
}
