import { CODEGEN_FRAMEWORK_CONFIGS } from "./codegen-config";
import { createCodegenFrameworkStrategy } from "./codegen-framework";

export const nextjsStrategy = createCodegenFrameworkStrategy(
	CODEGEN_FRAMEWORK_CONFIGS.nextjs,
);
