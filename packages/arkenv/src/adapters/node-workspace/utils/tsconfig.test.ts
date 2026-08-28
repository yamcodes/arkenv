import { describe, expect, it, vi } from "vitest";
import { ensureNextjsArkEnvTsConfig } from "./tsconfig";

describe("ensureNextjsArkEnvTsConfig", () => {
	it("adds @/.arkenv path and include glob", async () => {
		const writeFile = vi.fn();
		const workspace = {
			readFile: vi.fn().mockResolvedValue(`{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts"]
}
`),
			writeFile,
		};

		const result = await ensureNextjsArkEnvTsConfig(
			workspace,
			"/test/tsconfig.json",
		);

		expect(result.status).toBe("updated");
		const written = writeFile.mock.calls[0][1] as string;
		expect(written).toContain('"@/.arkenv"');
		expect(written).toContain("./.arkenv/index.ts");
		expect(written).toContain(".arkenv/**/*.ts");
	});

	it("is a no-op when already configured", async () => {
		const writeFile = vi.fn();
		const workspace = {
			readFile: vi.fn().mockResolvedValue(`{
  "compilerOptions": {
    "paths": {
      "@/.arkenv": ["./.arkenv/index.ts"]
    }
  },
  "include": [".arkenv/**/*.ts"]
}
`),
			writeFile,
		};

		const result = await ensureNextjsArkEnvTsConfig(
			workspace,
			"/test/tsconfig.json",
		);

		expect(result.status).toBe("already_configured");
		expect(writeFile).not.toHaveBeenCalled();
	});
});
