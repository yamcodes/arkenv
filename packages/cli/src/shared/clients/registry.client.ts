export type Example = {
	id: string;
	name: string;
	description?: string;
	framework: "vite" | "bun-fullstack" | "vanilla";
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
						id: "with-vite-react",
						name: "React + Vite",
						framework: "vite",
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
				],
			};
		}
	}
}
