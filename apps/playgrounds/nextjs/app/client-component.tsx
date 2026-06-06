"use client";

import { useState } from "react";
import { env } from "@/env";

export default function ClientComponent() {
	const [secretError, setSecretError] = useState<string | null>(null);

	const tryAccessSecret = () => {
		try {
			// This should throw a runtime error on the client
			const dbUrl = env.DATABASE_URL;
			alert(`Secret accessed successfully: ${dbUrl}`);
		} catch (e: any) {
			setSecretError(e.message || String(e));
		}
	};

	return (
		<div
			style={{
				marginTop: "24px",
				padding: "16px",
				border: "1px solid #e2e8f0",
				borderRadius: "8px",
			}}
		>
			<h3>Client Component Context</h3>
			<p>
				<strong>Client Variable:</strong> <code>{env.NEXT_PUBLIC_API_URL}</code>
			</p>
			<p>
				<strong>Shared Variable:</strong> <code>{env.NODE_ENV}</code>
			</p>

			<button
				type="button"
				onClick={tryAccessSecret}
				style={{
					padding: "8px 16px",
					backgroundColor: "#ef4444",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
					fontWeight: "bold",
				}}
			>
				Try accessing DATABASE_URL (Secret)
			</button>

			{secretError && (
				<div
					style={{
						marginTop: "12px",
						padding: "8px",
						backgroundColor: "#fee2e2",
						color: "#991b1b",
						borderRadius: "4px",
					}}
				>
					<strong>Blocked Runtime Error:</strong>
					<pre style={{ whiteSpace: "pre-wrap", margin: "4px 0 0 0" }}>
						{secretError}
					</pre>
				</div>
			)}
		</div>
	);
}
