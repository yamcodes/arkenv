import type { Reporter } from "../plan";
import type { Logger } from "./logger";

export class CliReporter implements Reporter {
	constructor(private logger: Logger) {}

	spinner() {
		return this.logger.spinner();
	}

	step(msg: string) {
		this.logger.step(msg);
	}

	info(msg: string) {
		this.logger.info(msg);
	}

	warn(msg: string) {
		this.logger.warn(msg);
	}

	error(msg: string) {
		this.logger.error(msg);
	}

	note(msg: string, title?: string) {
		this.logger.note(msg, title);
	}

	finish(msg: string, meta: any) {
		this.logger.finish(msg, meta);
	}
}
