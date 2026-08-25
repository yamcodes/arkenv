/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_MY_VAR: string;
	readonly VITE_MY_NUMBER: number;
	readonly VITE_MY_BOOLEAN: boolean;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
