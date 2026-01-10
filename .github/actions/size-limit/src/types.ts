export type SizeLimitResult = {
	package: string;
	file: string;
	size: string;
	limit: string;
	status: "✅" | "❌";
	diff?: string;
};

export type SizeInBytes = number;

export type SizeLimitState = {
	package: string;
	file?: string;
	size?: string;
	limit?: string;
	status: "✅" | "❌";
};
