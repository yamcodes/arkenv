export type BenchmarkTier = "primary" | "competitor" | "reference";

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
	note?: string;
};

export type ValidatorTab = "arktype" | "zod" | "valibot";

export type BenchmarkData = Record<ValidatorTab, BenchmarkRow[]>;
