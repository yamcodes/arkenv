"use client";

import { useEffect, useId, useState } from "react";

type TSPlaygroundProps = {
	initialCode?: string;
	height?: number;
	compilerOptions?: Record<string, unknown>;
};

export default function TSPlayground({
	initialCode = `interface User { name: string; age: number }
const user: User = { name: "John", age: "30" } // <- type error
console.log(user.name.toUpperCase())`,
	height = 400,
	compilerOptions = { strict: true, target: "ES2020" },
}: TSPlaygroundProps) {
	const domId = useId();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const loadScript = (src: string): Promise<void> =>
			new Promise((resolve, reject) => {
				// avoid duplicate loads
				if ([...document.scripts].some((s) => s.src === src)) {
					return resolve();
				}
				const s = document.createElement("script");
				s.src = src;
				s.async = true;
				s.onload = () => resolve();
				s.onerror = () => reject(new Error(`Failed to load ${src}`));
				document.head.appendChild(s);
			});

		const waitForDependencies = (): Promise<void> => {
			return new Promise((resolve, reject) => {
				let attempts = 0;
				const maxAttempts = 100; // 5 seconds max

				const checkDependencies = () => {
					const w = window as any;
					if (w.createTypeScriptSandbox && w.ts && w.lzstring) {
						resolve();
					} else if (attempts >= maxAttempts) {
						reject(new Error("Timeout waiting for dependencies"));
					} else {
						attempts++;
						setTimeout(checkDependencies, 50);
					}
				};

				checkDependencies();
			});
		};

		const initializeSandbox = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Load dependencies in order
				await loadScript(
					"https://www.typescriptlang.org/js/sandbox/vendor/lzstring.min.js",
				);
				await loadScript(
					"https://www.typescriptlang.org/js/sandbox/sandbox.js",
				);

				// Wait for all dependencies to be available
				await waitForDependencies();

				// Create the sandbox
				const w = window as any;
				w.createTypeScriptSandbox(
					{
						text: initialCode,
						domID: domId,
						compilerOptions,
						monacoSettings: {
							minimap: { enabled: false },
							automaticLayout: true,
						},
					},
					w.ts,
					w.lzstring,
				);

				setIsLoading(false);
			} catch (err) {
				setError(
					`Failed to load TypeScript Playground: ${err instanceof Error ? err.message : "Unknown error"}`,
				);
				setIsLoading(false);
				// eslint-disable-next-line no-console
				console.error(err);
			}
		};

		initializeSandbox();
	}, [domId, initialCode, compilerOptions]);

	return (
		<div
			style={{
				height,
				minHeight: height,
				border: "1px solid #e5e7eb",
				borderRadius: 8,
				overflow: "hidden",
				position: "relative",
			}}
		>
			{isLoading && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "#f9fafb",
						color: "#6b7280",
					}}
				>
					Loading TypeScript Playground...
				</div>
			)}
			{error && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "#fef2f2",
						color: "#dc2626",
						padding: "12px",
						textAlign: "center",
					}}
				>
					{error}
				</div>
			)}
			<div
				id={domId}
				style={{
					height: "100%",
					width: "100%",
				}}
			/>
		</div>
	);
}

// global types
declare global {
	interface Window {
		ts: any;
		lzstring: any;
		createTypeScriptSandbox?: (
			cfg: any,
			ts: any,
			lz: any,
		) => { dispose?: () => void };
	}
}
