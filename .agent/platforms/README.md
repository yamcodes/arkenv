# Agent Platform Archive

This directory contains configurations for AI agents and IDE extensions that are not currently in active use. 

Since most agents (Cursor, Claude Dev, etc.) hardcode their configuration paths to the project root, these folders have been archived here to keep the root directory clean.

## How to Reactivate

If you decide to switch platforms, move the corresponding folder or file back to the location specified below:

| Platform | Archived Path | Active Root Path |
| :--- | :--- | :--- |
| **Cursor** | `platforms/.cursor/` | `./.cursor/` |
| **Claude** | `platforms/.claude/` | `./.claude/` |
| **Copilot** | `platforms/copilot-instructions.md` | `./.github/copilot-instructions.md` |

## Active Agents

Currently, the project is configured for:
- **Gemini CLI**: Uses `.gemini/` and `.agent/AGENTS.md`.
