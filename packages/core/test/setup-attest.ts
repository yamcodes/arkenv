import { setup } from "@ark/attest";

export default () =>
	setup({
		formatter: "nubx prettier --write",
	});
