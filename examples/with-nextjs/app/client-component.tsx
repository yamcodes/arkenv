"use client";

import { ArkEnvError } from "@arkenv/core";
import { useState } from "react";
import { env } from "@/env";

type BoundaryThrowInspection = {
	stringified: string;
	name: string;
	constructorName: string;
	isNativeError: boolean;
	isArkEnvErrorInstance: boolean;
};

function inspectBoundaryThrow(error: unknown): BoundaryThrowInspection {
	if (!(error instanceof Error)) {
		return {
			stringified: String(error),
			name: typeof error,
			constructorName: "unknown",
			isNativeError: false,
			isArkEnvErrorInstance: false,
		};
	}

	return {
		stringified: String(error),
		name: error.name,
		constructorName: error.constructor.name,
		isNativeError: true,
		isArkEnvErrorInstance: error instanceof ArkEnvError,
	};
}

const rowStyle = {
	borderTop: "1px solid #fecaca",
} as const;

const cellStyle = {
	padding: "6px 8px",
	textAlign: "left" as const,
	verticalAlign: "top" as const,
};

export default function ClientComponent() {
	const [inspection, setInspection] = useState<BoundaryThrowInspection | null>(
		null,
	);

	const tryAccessSecret = () => {
		try {
			// Types allow this for a great DX, but the runtime Proxy enforces the
			// security boundary: accessing a server-only variable on the client throws.
			const dbUrl = env.DATABASE_URL;
			alert(`Secret accessed successfully: ${dbUrl}`);
		} catch (error: unknown) {
			setInspection(inspectBoundaryThrow(error));
			console.error(error);
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

			{inspection && (
				<div
					style={{
						marginTop: "12px",
						padding: "12px",
						backgroundColor: "#fee2e2",
						color: "#991b1b",
						borderRadius: "4px",
					}}
				>
					<strong>Boundary access throw</strong>
					<pre
						style={{
							whiteSpace: "pre-wrap",
							margin: "8px 0",
							fontSize: "13px",
						}}
					>
						{inspection.stringified}
					</pre>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
							fontSize: "13px",
						}}
					>
						<tbody>
							<tr style={rowStyle}>
								<th style={{ ...cellStyle, width: "55%" }}>error.name</th>
								<td style={cellStyle}>{inspection.name}</td>
							</tr>
							<tr style={rowStyle}>
								<th style={cellStyle}>error.constructor.name</th>
								<td style={cellStyle}>{inspection.constructorName}</td>
							</tr>
							<tr style={rowStyle}>
								<th style={cellStyle}>error instanceof Error</th>
								<td style={cellStyle}>{String(inspection.isNativeError)}</td>
							</tr>
							<tr style={rowStyle}>
								<th style={cellStyle}>error instanceof ArkEnvError</th>
								<td style={cellStyle}>
									{String(inspection.isArkEnvErrorInstance)}
								</td>
							</tr>
						</tbody>
					</table>
					<p style={{ margin: "12px 0 0 0", fontSize: "13px" }}>
						The same throw is in the browser console. The stack looks like a
						validation error. <code>instanceof ArkEnvError</code> is false
						because this is a native <code>Error</code> with a branded name —
						not a schema failure, and there are no <code>.issues</code>.
					</p>
				</div>
			)}
		</div>
	);
}
