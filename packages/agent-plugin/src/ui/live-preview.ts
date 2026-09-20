/**
 * ArkEnv Live Preview MCP App (POC).
 */

import type { CallToolResult } from "@modelcontextprotocol/client";
import {
	App,
	applyDocumentTheme,
	applyHostFonts,
	applyHostStyleVariables,
	type McpUiHostContext,
} from "@modelcontextprotocol/ext-apps";
import "./live-preview.css";

type PreviewRow = {
	key: string;
	boundary: string;
	inExample: boolean | null;
	status: string;
	reason: string;
	received?: string;
};

type PreviewReport = {
	schemaPath: string | null;
	examplePath: string | null;
	rows: PreviewRow[];
	cwd?: string;
	checkRan?: boolean;
	note?: string;
};

type PreviewArgs = { cwd?: string };

const root = document.getElementById("root")!;

root.innerHTML = `
  <main class="lp">
    <header class="lp__header">
      <div>
        <p class="lp__eyebrow">ArkEnv · POC</p>
        <h1 class="lp__title">Live Preview</h1>
      </div>
      <button type="button" class="lp__btn" id="refresh">Refresh</button>
    </header>
    <p class="lp__meta" id="meta">Waiting for tool result…</p>
    <p class="lp__note" id="note" hidden></p>
    <div class="lp__filters">
      <button type="button" data-filter="all" class="lp__chip is-active">All</button>
      <button type="button" data-filter="fail" class="lp__chip">Failing</button>
      <button type="button" data-filter="missing" class="lp__chip">Missing example</button>
      <button type="button" data-filter="ok" class="lp__chip">Ok</button>
    </div>
    <div class="lp__table-wrap">
      <table class="lp__table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Boundary</th>
            <th>Example</th>
            <th>Status</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
  </main>
`;

const metaEl = document.getElementById("meta")!;
const noteEl = document.getElementById("note")!;
const rowsEl = document.getElementById("rows")!;
const refreshBtn = document.getElementById("refresh") as HTMLButtonElement;

let report: PreviewReport | null = null;
let toolArgs: PreviewArgs = {};
let filter: "all" | "fail" | "missing" | "ok" = "all";
let hydrateInFlight: Promise<void> | null = null;

function isPreviewReport(value: unknown): value is PreviewReport {
	return (
		typeof value === "object" &&
		value !== null &&
		"rows" in value &&
		Array.isArray((value as PreviewReport).rows)
	);
}

function extractReport(result: CallToolResult): PreviewReport | null {
	const structured = result.structuredContent;
	if (isPreviewReport(structured)) return structured;

	for (const block of result.content ?? []) {
		if (block.type !== "text" || !("text" in block)) continue;
		const text = block.text;
		if (typeof text !== "string") continue;

		const marker = text.indexOf("arkenv-preview-json:");
		if (marker !== -1) {
			try {
				const parsed: unknown = JSON.parse(
					text.slice(marker + "arkenv-preview-json:".length),
				);
				if (isPreviewReport(parsed)) return parsed;
			} catch {
				// try other strategies
			}
		}

		const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
		const candidate = fenced?.[1]?.trim() ?? text.trim();
		if (!candidate.startsWith("{")) continue;
		try {
			const parsed: unknown = JSON.parse(candidate);
			if (isPreviewReport(parsed)) return parsed;
		} catch {
			// try next block
		}
	}
	return null;
}

function rememberArgs(args: PreviewArgs | undefined) {
	if (!args || typeof args !== "object") return;
	if (typeof args.cwd === "string" && args.cwd.trim()) {
		toolArgs = { ...toolArgs, cwd: args.cwd };
	}
}

function argsForHydrate(): PreviewArgs {
	if (typeof toolArgs.cwd === "string" && toolArgs.cwd) return { cwd: toolArgs.cwd };
	if (typeof report?.cwd === "string" && report.cwd) return { cwd: report.cwd };
	return {};
}

function applyToolResult(result: CallToolResult): boolean {
	const next = extractReport(result);
	if (!next) return false;
	// Never replace a populated board with an empty "no schema" miss from a
	// wrong-cwd refresh — unless we have no board yet.
	if (
		report &&
		report.rows.length > 0 &&
		next.rows.length === 0 &&
		!next.schemaPath
	) {
		noteEl.hidden = false;
		noteEl.textContent = `Ignored empty preview from cwd=${next.cwd ?? "(default)"}; keeping prior board.`;
		return true;
	}
	report = next;
	if (next.cwd) rememberArgs({ cwd: next.cwd });
	render();
	return true;
}

function render() {
	if (!report) {
		rowsEl.innerHTML = "";
		return;
	}

	metaEl.textContent = [
		report.schemaPath ? `schema: ${report.schemaPath}` : "schema: —",
		report.examplePath ? `example: ${report.examplePath}` : "example: —",
		`${report.rows.length} keys`,
		report.checkRan === true
			? "check ran"
			: report.checkRan === false
				? "check unavailable"
				: null,
	]
		.filter(Boolean)
		.join(" · ");

	if (report.note) {
		noteEl.hidden = false;
		noteEl.textContent = report.note;
	} else {
		noteEl.hidden = true;
		noteEl.textContent = "";
	}

	const filtered = report.rows.filter((row) => {
		if (filter === "all") return true;
		if (filter === "fail") return row.status === "fail";
		if (filter === "missing") return row.status === "missing";
		if (filter === "ok") return row.status === "ok";
		return true;
	});

	if (filtered.length === 0) {
		rowsEl.innerHTML = `<tr><td colspan="5" class="lp__empty">No rows for this filter.</td></tr>`;
		return;
	}

	rowsEl.innerHTML = filtered
		.map((row) => {
			const example =
				row.inExample === null ? "—" : row.inExample ? "yes" : "no";
			const why = row.received
				? `${escapeHtml(row.reason)} <span class="lp__was">(was ${escapeHtml(row.received)})</span>`
				: escapeHtml(row.reason);
			return `<tr data-status="${escapeHtml(row.status)}">
        <td><code>${escapeHtml(row.key)}</code></td>
        <td>${escapeHtml(row.boundary)}</td>
        <td>${example}</td>
        <td><span class="lp__status lp__status--${escapeHtml(row.status)}">${escapeHtml(row.status)}</span></td>
        <td>${why}</td>
      </tr>`;
		})
		.join("");
}

function escapeHtml(value: string): string {
	return value
		.split("&")
		.join("&amp;")
		.split("<")
		.join("&lt;")
		.split(">")
		.join("&gt;")
		.split('"')
		.join("&quot;");
}

function handleHostContextChanged(ctx: McpUiHostContext) {
	if (ctx.theme) applyDocumentTheme(ctx.theme);
	if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
	if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
}

/**
 * Re-call preview with the same cwd the host originally used. Hosts that strip
 * structuredContent from tool-result still return it from callServerTool.
 */
async function hydrateFromServer(force = false) {
	if (hydrateInFlight) return hydrateInFlight;
	const args = argsForHydrate();
	if (!args.cwd && !force && report?.rows.length) return;

	hydrateInFlight = (async () => {
		metaEl.textContent = args.cwd
			? `Loading preview for ${args.cwd}…`
			: "Loading preview from server…";
		try {
			const result = await app.callServerTool({
				name: "preview",
				arguments: args,
			});
			if (!applyToolResult(result)) {
				noteEl.hidden = false;
				noteEl.textContent =
					"Preview tool returned no board payload. Reload the MCP server after rebuilding @arkenv/agent-plugin.";
			}
		} catch (error) {
			noteEl.hidden = false;
			noteEl.textContent = `Could not load preview: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			hydrateInFlight = null;
		}
	})();
	return hydrateInFlight;
}

const app = new App({ name: "ArkEnv Live Preview", version: "0.0.0-poc" });

app.onteardown = async () => ({});
app.onerror = console.error;
app.onhostcontextchanged = handleHostContextChanged;

app.ontoolinput = (params) => {
	const args = (params.arguments ?? {}) as PreviewArgs;
	rememberArgs(args);
};

app.ontoolresult = (result) => {
	if (applyToolResult(result)) return;
	void hydrateFromServer(true);
};

refreshBtn.addEventListener("click", () => {
	refreshBtn.disabled = true;
	void hydrateFromServer(true).finally(() => {
		refreshBtn.disabled = false;
	});
});

for (const chip of document.querySelectorAll<HTMLButtonElement>(
	"[data-filter]",
)) {
	chip.addEventListener("click", () => {
		filter = chip.dataset.filter as typeof filter;
		for (const other of document.querySelectorAll(".lp__chip")) {
			other.classList.toggle("is-active", other === chip);
		}
		render();
	});
}

void (async () => {
	await app.connect();
	const ctx = app.getHostContext();
	if (ctx) handleHostContextChanged(ctx);
})();
