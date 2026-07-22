import { setDefaultBootGateEngine } from "@/module-engine";

// Pin the Standard engine before re-exporting the shared module implementation.
setDefaultBootGateEngine("standard");

export * from "@/module";
export { default } from "@/module";
