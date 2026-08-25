import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
	title: "Acme",
	description: "Acme dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body
				style={{
					margin: 0,
					fontFamily:
						"ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
					color: "#0f172a",
					background: "#f8fafc",
				}}
			>
				<header
					style={{
						display: "flex",
						alignItems: "center",
						gap: 24,
						padding: "14px 28px",
						borderBottom: "1px solid #e2e8f0",
						background: "white",
					}}
				>
					<strong style={{ fontSize: 16 }}>Acme</strong>
					<nav style={{ display: "flex", gap: 16, fontSize: 14 }}>
						<a href="/" style={{ color: "#334155", textDecoration: "none" }}>
							Dashboard
						</a>
						<a
							href="/billing"
							style={{ color: "#334155", textDecoration: "none" }}
						>
							Billing
						</a>
					</nav>
				</header>
				{children}
			</body>
		</html>
	);
}
