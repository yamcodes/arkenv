export type BenchmarkTier = "primary" | "competitor" | "reference";
export type BenchmarkSource = "esbuild" | "bundlephobia";

export type BenchmarkRow = {
	id: string;
	name: string;
	npmPackage: string;
	engineBytes: number;
	engineKb: string;
	engineGzipBytes: number;
	engineGzipKb: string;
	validatorName?: string;
	validatorBytes?: number;
	validatorKb?: string;
	validatorGzipBytes?: number;
	validatorGzipKb?: string;
	totalBytes: number;
	totalKb: string;
	totalGzipBytes: number;
	totalGzipKb: string;
	tier: BenchmarkTier;
	source: BenchmarkSource;
	note?: string;
};

export type BenchmarkMatrixItem = {
	engine: string;
	subpath: string;
	totalBytes: number;
	totalKb: string;
	gzipBytes: number;
	gzipKb: string;
	source: BenchmarkSource;
	description: string;
};

export type BenchmarkData = {
	leaderboard: BenchmarkRow[];
	matrix: {
		valibot: BenchmarkMatrixItem;
		zodMini: BenchmarkMatrixItem;
		arktype: BenchmarkMatrixItem;
		classicZod: BenchmarkMatrixItem;
	};
};
