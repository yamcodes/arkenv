export type Template = {
	id: string;
	name: string;
	description?: string;
	framework: "vite" | "bun-fullstack" | "vanilla";
};

export type TemplateRegistry = {
	templates: Template[];
};

const REGISTRY_URL =
	"https://raw.githubusercontent.com/yamcodes/arkenv/main/examples/registry.json";

export class RegistryClient {
	async fetchRegistry(): Promise<TemplateRegistry> {
		try {
			const response = await fetch(REGISTRY_URL);
			if (!response.ok) {
				throw new Error(`Failed to fetch registry: ${response.statusText}`);
			}
			return (await response.json()) as TemplateRegistry;
		} catch {
			// Fallback to a minimal registry if fetch fails or for offline use
			return {
				templates: [
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
