import arkenv from "@arkenv/bun-plugin";

// Configure the ArkEnv Bun plugin with your environment variable schema
// This file is referenced in bunfig.toml under [serve.static] plugins
export default arkenv({
	BUN_PUBLIC_API_URL: "string",
	BUN_PUBLIC_DEBUG: "boolean",
});

