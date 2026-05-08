import fs from "node:fs/promises";
import path from "node:path";

async function enforceStrictTsConfig(cwd: string): Promise<
	"updated" | "already_strict" | "not_found" | "error"
> {
	const tsConfigPath = path.join(cwd, "tsconfig.json");
	try {
		const content = await fs.readFile(tsConfigPath, "utf-8");

		// Check if strict is already true
		if (/"strict"\s*:\s*true/.test(content)) {
			return "already_strict";
		}

		// If strict is false, replace it
		if (/"strict"\s*:\s*false/.test(content)) {
			const updated = content.replace(/"strict"\s*:\s*false/, '"strict": true');
			await fs.writeFile(tsConfigPath, updated, "utf-8");
			return "updated";
		}

		// If strict doesn't exist, try to add it to compilerOptions
		if (/"compilerOptions"\s*:\s*\{/.test(content)) {
			const updated = content.replace(
				/("compilerOptions"\s*:\s*\{)/,
				'$1\n    "strict": true,',
			);
			await fs.writeFile(tsConfigPath, updated, "utf-8");
			return "updated";
		}

		// If no compilerOptions, add it
		if (/\{/.test(content)) {
			const updated = content.replace(
				/\{/,
				'{\n  "compilerOptions": {\n    "strict": true\n  },',
			);
			await fs.writeFile(tsConfigPath, updated, "utf-8");
			return "updated";
		}

		return "error";
	} catch (e: any) {
		if (e.code === "ENOENT") return "not_found";
		return "error";
	}
}

async function runTest() {
    const testDir = path.resolve("./test-strict-dir");
    await fs.mkdir(testDir, { recursive: true });

    // Test 1: No tsconfig
    console.log("Test 1 (No tsconfig):", await enforceStrictTsConfig(testDir));

    // Test 2: Existing strict: true
    await fs.writeFile(path.join(testDir, "tsconfig.json"), '{ "compilerOptions": { "strict": true } }');
    console.log("Test 2 (Already strict):", await enforceStrictTsConfig(testDir));

    // Test 3: Existing strict: false
    await fs.writeFile(path.join(testDir, "tsconfig.json"), '{ "compilerOptions": { "strict": false } }');
    console.log("Test 3 (Strict false -> true):", await enforceStrictTsConfig(testDir));
    console.log("Content:", await fs.readFile(path.join(testDir, "tsconfig.json"), "utf-8"));

    // Test 4: No strict, has compilerOptions
    await fs.writeFile(path.join(testDir, "tsconfig.json"), '{ "compilerOptions": { "target": "ESNext" } }');
    console.log("Test 4 (Add strict to compilerOptions):", await enforceStrictTsConfig(testDir));
    console.log("Content:", await fs.readFile(path.join(testDir, "tsconfig.json"), "utf-8"));

    // Test 5: No compilerOptions
    await fs.writeFile(path.join(testDir, "tsconfig.json"), '{ "files": [] }');
    console.log("Test 5 (Add compilerOptions and strict):", await enforceStrictTsConfig(testDir));
    console.log("Content:", await fs.readFile(path.join(testDir, "tsconfig.json"), "utf-8"));

    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
}

runTest();
