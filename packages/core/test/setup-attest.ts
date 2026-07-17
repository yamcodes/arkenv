import { setup } from "@ark/attest";

export default () =>
	setup({
		formatter: "pnpm exec prettier --write",
	});
