export type Example = {
	id: string;
	name: string;
	description?: string;
	framework: "vite" | "bun-fullstack" | "vanilla" | "nextjs";
};

export type ExampleRegistry = {
	examples: Example[];
};

const REGISTRY_URL =
	"https://raw.githubusercontent.com/yamcodes/arkenv/main/examples/registry.json";

export class RegistryClient {
	/**
	 * Fetches the published example example registry, falling back to bundled defaults offline.
	 */
	async fetchRegistry(): Promise<ExampleRegistry> {
		try {
			const response = await fetch(REGISTRY_URL);
			if (!response.ok) {
				throw new Error(`Failed to fetch registry: ${response.statusText}`);
			}
			return (await response.json()) as ExampleRegistry;
		} catch {
			// Fallback to a minimal registry if fetch fails or for offline use
			return {
				examples: [
					{
						id: "basic",
						name: "Basic",
						description: "A minimal ArkEnv setup in Node.js",
						framework: "vanilla",
					},
					{
						id: "with-nextjs",
						name: "Next.js",
						description: "Minimal Next.js project with ArkType",
						framework: "nextjs",
					},
					{
						id: "with-nextjs-standard",
						name: "Next.js (Standard Schema)",
						description: "Next.js with @arkenv/nextjs/standard and Zod",
						framework: "nextjs",
					},
					{
						id: "with-vite-react",
						name: "React + Vite",
						framework: "vite",
					},
					{
						id: "with-vite-react-standard",
						name: "React + Vite (Standard Schema)",
						description:
							"React + Vite with @arkenv/vite-plugin/standard and Zod",
						framework: "vite",
					},
					{
						id: "with-bun",
						name: "Bun (Vanilla)",
						description: "Minimal Bun project with ArkType",
						framework: "vanilla",
					},
					{
						id: "with-bun-react",
						name: "React + Bun fullstack dev server",
						framework: "bun-fullstack",
					},
					{
						id: "with-zod",
						name: "Zod",
						description: "ArkEnv with Zod in Node.js",
						framework: "vanilla",
					},
					{
						id: "with-valibot",
						name: "Valibot",
						description: "ArkEnv with Valibot in Node.js",
						framework: "vanilla",
					},
				],
			};
		}
	}
}
