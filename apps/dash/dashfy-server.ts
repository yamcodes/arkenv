import arkenv from "@arkenv/core";
import { createGitHubClient } from "@getdashfy/ext-github/client";
import { createJsonClient } from "@getdashfy/ext-json/client";
import { Dashfy } from "@getdashfy/server";
import { Env } from "./env";

const env = arkenv(Env);

process.env.HOST = env.HOST;
process.env.PORT = String(env.PORT);

const githubToken = env.GITHUB_TOKEN || undefined;

const githubJsonHeaders: Record<string, string> = {
	Accept: "application/vnd.github+json",
	"User-Agent": "arkenv-dash",
};

if (githubToken) {
	githubJsonHeaders.Authorization = `Bearer ${githubToken}`;
}

const dashfy = new Dashfy();

dashfy.registerApi("github", createGitHubClient({ token: githubToken }));
dashfy.registerApi("json", createJsonClient());
dashfy.registerApi(
	"github-json",
	createJsonClient({ headers: githubJsonHeaders }),
);

await dashfy.configureFromFile("./dashfy.config.yml");
await dashfy.start();
