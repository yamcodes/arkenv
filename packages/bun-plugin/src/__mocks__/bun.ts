// Mock Bun plugin API for testing
export function plugin(pluginConfig: {
	name: string;
	setup: (build: {
		onLoad: (
			args: { filter: RegExp },
			callback: (args: { path: string }) => Promise<{
				loader?: string;
				contents?: string;
			} | undefined>,
		) => void;
	}) => void;
}) {
	return {
		name: pluginConfig.name,
		setup: pluginConfig.setup,
	};
}

export type BunPlugin = ReturnType<typeof plugin>;

