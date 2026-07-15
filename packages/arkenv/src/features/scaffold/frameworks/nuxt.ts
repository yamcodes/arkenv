import { CODEGEN_FRAMEWORK_CONFIGS } from "./codegen-config";
import { createCodegenFrameworkStrategy } from "./codegen-framework";

export const nuxtStrategy = createCodegenFrameworkStrategy(
	CODEGEN_FRAMEWORK_CONFIGS.nuxt,
);
