import type { SizeInBytes } from "../types.ts";

// Convert size string (e.g., "711 B", "1.2 kB", "5 MB", "2.5 GiB") to bytes
export const parseSizeToBytes = (sizeStr: string): SizeInBytes => {
	// Match number and optional unit (case-insensitive)
	const match = sizeStr.match(/^([0-9.]+)\s*([a-z]*)$/i);
	if (!match || !match[1]) {
		return 0;
	}

	const value = Number.parseFloat(match[1]);
	const unit = match[2]?.toLowerCase() ?? "";

	// Handle bytes (no unit or just 'b')
	if (!unit || unit === "b") {
		return value;
	}

	// Map units to multipliers (using 1024-based)
	const multipliers: Record<string, number> = {
		k: 1024 ** 1,
		kb: 1024 ** 1,
		kib: 1024 ** 1,
		m: 1024 ** 2,
		mb: 1024 ** 2,
		mib: 1024 ** 2,
		g: 1024 ** 3,
		gb: 1024 ** 3,
		gib: 1024 ** 3,
	};

	const multiplier = multipliers[unit];
	if (multiplier === undefined) {
		return 0;
	}

	return value * multiplier;
};

// Calculate percentage difference
export const calculateDiff = (
	current: SizeInBytes,
	baseline: SizeInBytes,
): string => {
	if (baseline === 0) {
		return current > 0 ? "+∞%" : "—";
	}

	// Check if sizes are equal (or very close due to floating point precision)
	// If sizes are the same, show "0.0%" regardless of calculated diff
	if (current === baseline || Math.abs(current - baseline) < 0.5) {
		return "0.0%";
	}

	const diff = ((current - baseline) / baseline) * 100;
	// Show "—" for very small changes (< 0.1%) that aren't exactly equal
	if (Math.abs(diff) < 0.1) {
		return "—";
	}
	const sign = diff > 0 ? "+" : "";
	return `${sign}${diff.toFixed(1)}%`;
};

// Format bytes to human readable string
export const formatBytes = (bytes: number): string => {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "kB", "MB", "GB", "TB"];
	const i = Math.min(
		Math.floor(Math.log(bytes) / Math.log(k)),
		sizes.length - 1,
	);
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};
