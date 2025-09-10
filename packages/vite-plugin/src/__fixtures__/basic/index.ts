// Simple test file that imports environment variables
export const config = {
	apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
	debug: import.meta.env.VITE_DEBUG === "true",
};
