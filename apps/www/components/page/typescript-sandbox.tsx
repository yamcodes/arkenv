"use client";

import { useEffect, useId, useRef, useState } from "react";

// TypeScript Sandbox component following Next.js best practices
export function TypeScriptSandbox() {
	const editorRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const editorId = useId();

	useEffect(() => {
		if (!editorRef.current) return;

		const initializeSandbox = async () => {
			try {
				// Load the VSCode loader script
				const loaderScript = document.createElement("script");
				loaderScript.src = "https://www.typescriptlang.org/js/vs.loader.js";
				loaderScript.async = true;

				loaderScript.onload = async () => {
					// Configure require.js for Monaco and TypeScript Sandbox
					(window as any).require.config({
						paths: {
							vs: "https://playgroundcdn.typescriptlang.org/cdn/4.0.5/monaco/min/vs",
							sandbox: "https://www.typescriptlang.org/js/sandbox",
						},
						ignoreDuplicateModules: ["vs/editor/editor.main"],
					});

					// Load Monaco, TypeScript, and Sandbox
					(window as any).require(
						[
							"vs/editor/editor.main",
							"vs/language/typescript/tsWorker",
							"sandbox/index",
						],
						async (main: any, _tsWorker: any, sandboxFactory: any) => {
							if (!main || !(window as any).ts || !sandboxFactory) {
								setError("Could not load TypeScript Sandbox dependencies");
								setIsLoading(false);
								return;
							}

							// Load the actual example code dynamically
							const loadExampleCode = async () => {
								let initialCode = `import arkenv from "arkenv";

const env = arkenv({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

// Hover to see the ✨exact✨ types
const host = env.HOST;
const port = env.PORT;
const nodeEnv = env.NODE_ENV;

console.log({ host, port, nodeEnv });

export default env;`;

								// Try to fetch the actual example code from GitHub
								try {
									const response = await fetch(
										"https://raw.githubusercontent.com/yamcodes/arkenv/main/examples/basic/index.ts",
									);
									if (response.ok) {
										const fetchedCode = await response.text();
										initialCode = fetchedCode;
									}
								} catch {
									// Fallback to hardcoded version if fetch fails
									// Silently use fallback code
								}

								return initialCode;
							};

							// Load the example code and create sandbox
							const initialCode = await loadExampleCode();

							// Create sandbox configuration
							const sandboxConfig = {
								text: initialCode,
								compilerOptions: {
									target: 5, // ES2022
									module: 1, // ES2015
									strict: true,
									esModuleInterop: true,
									skipLibCheck: true,
									forceConsistentCasingInFileNames: true,
									moduleResolution: 2, // Node
									allowSyntheticDefaultImports: true,
									resolveJsonModule: true,
								},
								domID: editorId,
							};

							// Create the sandbox
							const sandbox = sandboxFactory.createTypeScriptSandbox(
								sandboxConfig,
								main,
								(window as any).ts,
							);

							// Add ArkEnv types to the sandbox
							// This simulates having arkenv available in the sandbox
							const arkenvTypes = `
declare module "arkenv" {
	/**
	 * Schema definition for environment variables
	 */
	interface EnvSchema {
		[key: string]: string;
	}
	
	/**
	 * Creates a typesafe environment object from a schema
	 * @param schema - Object defining environment variable types and defaults
	 * @returns Validated environment object with inferred types
	 * @example
	 * const env = arkenv({
	 *   HOST: "string.host",
	 *   PORT: "number.port",
	 *   NODE_ENV: "'development' | 'production' | 'test' = 'development'"
	 * });
	 */
	function arkenv<T extends EnvSchema>(schema: T): {
		[K in keyof T]: T[K] extends \`string.host\` 
			? string
			: T[K] extends \`number.port\`
			? number
			: T[K] extends \`boolean\`
			? boolean
			: T[K] extends \`string\`
			? string
			: T[K] extends \`number\`
			? number
			: string;
	};
	
	export = arkenv;
	export default arkenv;
}`;

							// Add the ArkEnv types to the sandbox
							sandbox.languageServiceDefaults.addExtraLib(
								arkenvTypes,
								"file:///node_modules/@types/arkenv/index.d.ts",
							);

							// Configure editor options for better UX
							sandbox.editor.updateOptions({
								hover: {
									enabled: true,
									delay: 300,
									sticky: true,
								},
								quickSuggestions: {
									other: true,
									comments: false,
									strings: true,
								},
								suggestOnTriggerCharacters: true,
								acceptSuggestionOnEnter: "on",
								tabCompletion: "on",
								wordBasedSuggestions: "off",
								parameterHints: {
									enabled: true,
								},
								formatOnPaste: true,
								formatOnType: true,
								automaticLayout: true,
								// Force left alignment by setting text direction and alignment
								direction: "ltr",
								wordWrap: "off",
								// Ensure proper text alignment
								renderLineHighlight: "all",
								renderWhitespace: "selection",
								// Configure hover widget positioning
								hoverWidget: {
									enabled: true,
								},
							});

							// Force left alignment with CSS and fix hover positioning
							const editorElement = document.getElementById(editorId);
							if (editorElement) {
								editorElement.style.textAlign = "left";
								editorElement.style.direction = "ltr";
								// Also apply to Monaco's view lines
								const viewLines = editorElement.querySelectorAll(".view-lines");
								viewLines.forEach((line) => {
									(line as HTMLElement).style.textAlign = "left";
									(line as HTMLElement).style.direction = "ltr";
								});

								// Fix hover tooltip positioning to allow floating outside editor
								const monacoEditor =
									editorElement.querySelector(".monaco-editor");
								if (monacoEditor) {
									(monacoEditor as HTMLElement).style.overflow = "visible";
									(monacoEditor as HTMLElement).style.position = "relative";
									(monacoEditor as HTMLElement).style.zIndex = "1000";
								}

								// Ensure hover widgets can float outside
								const hoverWidgets =
									editorElement.querySelectorAll(".monaco-hover");
								hoverWidgets.forEach((widget) => {
									(widget as HTMLElement).style.position = "absolute";
									(widget as HTMLElement).style.zIndex = "1001";
									(widget as HTMLElement).style.pointerEvents = "auto";
								});
							}

							// Configure editor with basic options
							sandbox.editor.updateOptions({
								scrollBeyondLastLine: false,
								minimap: { enabled: false },
								automaticLayout: true,
							});

							// Calculate optimal height based on content (following tutorial pattern)
							const model = sandbox.editor.getModel();
							if (model) {
								const lineCount = model.getLineCount();
								const lineHeight = 18; // Monaco's actual line height
								const padding = 40; // Extra padding for visual comfort
								const maxHeight = 600; // Maximum height before scrollbars

								// Calculate natural height needed
								const naturalHeight = lineCount * lineHeight + padding;
								const optimalHeight = Math.min(naturalHeight, maxHeight);

								// Set the editor container height directly (like the tutorial)
								const editorElement = document.getElementById(editorId);
								if (editorElement) {
									editorElement.style.height = `${optimalHeight}px`;
								}

								// Set container height to match
								if (containerRef.current) {
									containerRef.current.style.height = `${optimalHeight}px`;
								}

								// Configure scrollbars if content exceeds max height
								if (naturalHeight > maxHeight) {
									sandbox.editor.updateOptions({
										scrollbar: {
											vertical: "visible",
											horizontal: "auto",
										},
									});
								}
							}

							// Add content change listener to adjust height dynamically
							sandbox.editor.onDidChangeModelContent(() => {
								const model = sandbox.editor.getModel();
								if (model) {
									const lineCount = model.getLineCount();
									const lineHeight = 18;
									const padding = 40;
									const maxHeight = 600;

									const naturalHeight = lineCount * lineHeight + padding;
									const optimalHeight = Math.min(naturalHeight, maxHeight);

									// Update editor container height
									const editorElement = document.getElementById(editorId);
									if (editorElement) {
										editorElement.style.height = `${optimalHeight}px`;
									}

									// Update container height
									if (containerRef.current) {
										containerRef.current.style.height = `${optimalHeight}px`;
									}

									// Update scrollbar settings
									sandbox.editor.updateOptions({
										scrollbar: {
											vertical: naturalHeight > maxHeight ? "visible" : "auto",
											horizontal: "auto",
										},
									});
								}
							});

							// Focus the editor
							sandbox.editor.focus();
							setIsLoading(false);
						},
					);
				};

				loaderScript.onerror = () => {
					setError("Failed to load TypeScript Sandbox");
					setIsLoading(false);
				};

				document.body.appendChild(loaderScript);

				// Cleanup function
				return () => {
					if (document.body.contains(loaderScript)) {
						document.body.removeChild(loaderScript);
					}
				};
			} catch {
				setError("Failed to initialize TypeScript Sandbox");
				setIsLoading(false);
			}
		};

		initializeSandbox();
	}, [editorId]);

	// Additional effect to ensure left alignment and hover positioning after editor renders
	useEffect(() => {
		if (!isLoading) {
			const applyLeftAlignment = () => {
				const editorElement = document.getElementById(editorId);
				if (editorElement) {
					editorElement.style.textAlign = "left";
					editorElement.style.direction = "ltr";

					// Apply to all Monaco editor elements
					const monacoElements = editorElement.querySelectorAll(
						".monaco-editor, .view-lines, .view-line",
					);
					monacoElements.forEach((element) => {
						(element as HTMLElement).style.textAlign = "left";
						(element as HTMLElement).style.direction = "ltr";
					});

					// Fix hover tooltip positioning
					const monacoEditor = editorElement.querySelector(".monaco-editor");
					if (monacoEditor) {
						(monacoEditor as HTMLElement).style.overflow = "visible";
						(monacoEditor as HTMLElement).style.position = "relative";
						(monacoEditor as HTMLElement).style.zIndex = "1000";
					}

					// Ensure hover widgets can float outside
					const hoverWidgets = editorElement.querySelectorAll(".monaco-hover");
					hoverWidgets.forEach((widget) => {
						(widget as HTMLElement).style.position = "absolute";
						(widget as HTMLElement).style.zIndex = "1001";
						(widget as HTMLElement).style.pointerEvents = "auto";
					});
				}
			};

			// Apply immediately and after a short delay to catch dynamically created elements
			applyLeftAlignment();
			const timeoutId = setTimeout(applyLeftAlignment, 100);

			return () => clearTimeout(timeoutId);
		}
	}, [isLoading, editorId]);

	if (error) {
		return (
			<div className="w-full rounded-lg overflow-hidden border border-fd-border shadow-lg min-h-[600px] relative mb-4 flex items-center justify-center">
				<div className="text-center p-8">
					<p className="text-red-500 mb-2">Failed to load TypeScript Sandbox</p>
					<p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="w-full rounded-lg border border-fd-border shadow-lg relative mb-4"
			style={{
				textAlign: "left",
				overflow: "visible", // Allow hover tooltips to float outside
				height: "auto", // Let it expand naturally
				minHeight: "300px", // Minimum height for loading
			}}
		>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Loading TypeScript Sandbox...
						</p>
					</div>
				</div>
			)}
			<div
				id={editorId}
				ref={editorRef}
				style={{
					textAlign: "left",
					direction: "ltr",
					height: "auto",
					width: "100%",
					minHeight: "300px",
				}}
			/>
		</div>
	);
}
