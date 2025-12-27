// Test file that imports environment variables from custom envDir
export const config = {
	customVar: import.meta.env.VITE_CUSTOM_VAR || "",
	fromEnvDir: import.meta.env.VITE_FROM_ENV_DIR || "",
};
