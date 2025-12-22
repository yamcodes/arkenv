import { scope, type, match } from "arktype";

/**
 * 🛠️ THE CORE COERCION LOGIC
 */
const maybeParsedNumber = (s: any) => {
	if (typeof s === "number") return s;
	if (typeof s !== "string" || s.trim() === "") return s;
	const n = Number(s);
	return Number.isNaN(n) ? s : n;
};

const maybeParsedBoolean = (s: any) => {
	if (typeof s === "boolean") return s;
	if (s === "true") return true;
	if (s === "false") return false;
	return s;
};

/**
 * 🏗️ THE GENERIC COERCER
 */
function createCoercedSchema<T>(S: any): any {
	const paths: string[][] = [];

	const isNumeric = (node: any) => {
		if (node === "number") return true;
		if (typeof node === "object" && node !== null && !Array.isArray(node)) {
			if (node.domain === "number") return true;
			if (node.kind === "unit" && typeof node.unit === "number") return true;
			if (node.kind === "intersection" && node.domain === "number") return true;
		}
		return false;
	};

	const isBoolean = (node: any) => {
		if (node === "boolean") return true;
		// Check for union branch arrays e.g. [{unit: false}, {unit: true}]
		if (Array.isArray(node)) {
			return node.every((b) => b.unit === true || b.unit === false);
		}
		if (typeof node === "object" && node !== null) {
			if (node.domain === "boolean" || node.expression === "boolean")
				return true;
			if (node.kind === "unit" && typeof node.unit === "boolean") return true;
			if (
				node.branches &&
				node.branches.every((b: any) => b.unit === true || b.unit === false)
			)
				return true;
		}
		return false;
	};

	const findPaths = (node: any, path: string[]) => {
		if (isNumeric(node) || isBoolean(node)) {
			paths.push([...path]);
		}

		if (Array.isArray(node)) {
			node.forEach((b) => findPaths(b, path));
		} else if (typeof node === "object" && node !== null) {
			if (node.branches) node.branches.forEach((b: any) => findPaths(b, path));
			if (node.required)
				node.required.forEach((p: any) => findPaths(p.value, [...path, p.key]));
			if (node.optional)
				node.optional.forEach((p: any) => findPaths(p.value, [...path, p.key]));
		}
	};

	findPaths(S.in.json, []);

	const uniquePaths = Array.from(new Set(paths.map((p) => p.join("."))));

	const Cleaner = type("unknown").pipe((data: any) => {
		if (typeof data !== "object" || data === null) return data;
		const result = JSON.parse(JSON.stringify(data));
		for (const pathStr of uniquePaths) {
			const path = pathStr.split(".");
			let curr = result;
			for (let i = 0; i < path.length - 1; i++) {
				if (curr[path[i]] && typeof curr[path[i]] === "object") {
					curr = curr[path[i]];
				} else break;
			}
			const last = path[path.length - 1];
			if (last in curr) {
				curr[last] = maybeParsedNumber(maybeParsedBoolean(curr[last]));
			}
		}
		return result;
	});

	return Cleaner.pipe(S);
}

const $env = scope({ Port: "0 <= number <= 65535" });

const AppSchema = $env.type({
	PORT: "Port",
	DB: {
		PORT: "Port = 5432",
		SSL: "boolean = false",
	},
	DEBUG: "boolean = false",
	TIMEOUT: "number > 0 = 30",
	WORKERS: "1 <= number <= 16 = 4",
	BETA: "boolean | 'staff' = false",
});

const CoercedApp = createCoercedSchema(AppSchema);

const rawEnv = {
	PORT: "8080",
	DB: { PORT: "5444", SSL: "true" },
	DEBUG: "true",
	TIMEOUT: "60",
	WORKERS: "8",
	BETA: "staff",
};

console.log("──────────────────────────────────────────────────");
console.log("🚀 ArkEnv PoC: Path-Based Coercion (Full Logic)");
console.log("──────────────────────────────────────────────────");

const result = CoercedApp(rawEnv);

if (result instanceof type.errors) {
	console.error("❌ Failed:", result.summary);
} else {
	console.log("✅ SUCCESS!\n");
	console.log("PORT:    ", result.PORT, typeof result.PORT);
	console.log("DB.PORT: ", result.DB.PORT, typeof result.DB.PORT);
	console.log("DB.SSL:  ", result.DB.SSL, typeof result.DB.SSL);
	console.log("TIMEOUT: ", result.TIMEOUT, typeof result.TIMEOUT);
	console.log("WORKERS: ", result.WORKERS, typeof result.WORKERS);
	console.log("BETA:    ", result.BETA, typeof result.BETA);
}
