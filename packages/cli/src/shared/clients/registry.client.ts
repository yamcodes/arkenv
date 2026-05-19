export type Template = {
	id: string;
	name: string;
	description: string;
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
		} catch (error) {
			// Fallback to a minimal registry if fetch fails or for offline use
			return {
				templates: [
					{
						id: "basic",
						name: "Basic",
						description: "A minimal ArkEnv setup",
						framework: "vanilla",
					},
					{
						id: "with-vite-react",
						name: "Vite + React",
						description: "ArkEnv integrated with Vite and React",
						framework: "vite",
					},
					{
						id: "with-bun-react",
						name: "Bun + React",
						description: "ArkEnv integrated with Bun and React",
						framework: "bun-fullstack",
					},
					{
						id: "with-zod",
						name: "Zod",
						description: "ArkEnv with Zod validation",
						framework: "vanilla",
					},
				],
			};
		}
	}
}
