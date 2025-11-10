// Configuration extracted from environment variables
export interface Config {
	turboToken?: string;
	turboTeam?: string;
	filter: string;
	baseBranch: string;
	headBranch: string;
	isPR: boolean;
	isReleasePR: boolean;
}

// Get configuration from environment variables
export const getConfig = (): Config => {
	const turboToken = process.env.INPUT_TURBO_TOKEN;
	const turboTeam = process.env.INPUT_TURBO_TEAM;
	const filter = process.env.INPUT_FILTER || "./packages/*";
	const baseBranch = process.env.INPUT_BASE_BRANCH || "main";
	const headBranch = process.env.INPUT_HEAD_BRANCH || "";
	const isPR = process.env.GITHUB_EVENT_NAME === "pull_request";
	const isReleasePR = headBranch === "changeset-release/main";

	// Set Turbo environment variables if provided
	if (turboToken) {
		process.env.TURBO_TOKEN = turboToken;
	}
	if (turboTeam) {
		process.env.TURBO_TEAM = turboTeam;
	}

	return {
		turboToken,
		turboTeam,
		filter,
		baseBranch,
		headBranch,
		isPR,
		isReleasePR,
	};
};
