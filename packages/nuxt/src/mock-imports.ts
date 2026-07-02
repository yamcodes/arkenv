export function useRuntimeConfig(): any {
	return {
		public: process.env,
		...process.env,
	};
}
