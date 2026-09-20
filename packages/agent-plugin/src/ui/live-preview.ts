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
	note?: string;
};

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
let filter: "all" | "fail" | "missing" | "ok" = "all";

function extractReport(result: CallToolResult): PreviewReport | null {
	const structured = result.structuredContent as PreviewReport | undefined;
	if (structured?.rows) return structured;
	const text = result.content?.find((c) => c.type === "text");
	if (text && "text" in text && typeof text.text === "string") {
		try {
			return JSON.parse(text.text) as PreviewReport;
		} catch {
			return null;
		}
	}
	return null;
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
	].join(" · ");

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

const app = new App({ name: "ArkEnv Live Preview", version: "0.0.0-poc" });

app.onteardown = async () => ({});
app.onerror = console.error;
app.onhostcontextchanged = handleHostContextChanged;

app.ontoolresult = (result) => {
	report = extractReport(result);
	render();
};

refreshBtn.addEventListener("click", async () => {
	refreshBtn.disabled = true;
	try {
		const result = await app.callServerTool({
			name: "preview",
			arguments: {},
		});
		report = extractReport(result);
		render();
	} catch (error) {
		noteEl.hidden = false;
		noteEl.textContent = `Refresh failed: ${error instanceof Error ? error.message : String(error)}`;
	} finally {
		refreshBtn.disabled = false;
	}
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
