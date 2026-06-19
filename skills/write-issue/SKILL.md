---
name: write-issue
description: Write a new issue from scratch by grilling the user to clarify requirements, creating the issue on GitHub via the gh cli, and utilizing the triage skill to apply the correct label and add an agent brief if necessary. Use when the user wants to write, create, draft, open, or file a new issue on GitHub.
metadata:
  internal: true
---

# Write issue

This skill takes a user request to create a new issue, conducts an interactive grilling session with the user to clarify requirements, creates the issue on GitHub using the GitHub CLI (`gh`), and utilizes the existing `/triage` skill workflow to apply the correct canonical labels and post an authoritative agent brief.

## Trigger

Use this skill whenever the user says `/write-issue` or `/create-issue` or asks to "write", "create", "draft", "open", or "file" a new issue on GitHub.

## Workflow

### 1. Context gathering & initial assessment

Before asking any questions, you MUST examine the codebase to understand the domain and potential files/implementations relevant to the user's intent.

1. **Explore Codebase**: Explore the repository to understand the domain model and existing implementations relevant to the user's request. Refer to the project's domain glossary (`docs/CONTEXT.md`), ADRs (`docs/adr/`), and prior rejections (`.out-of-scope/*.md`).
2. **Determine Initial Scope**: Formulate a mental model of the feature/bug area, likely dependencies, and potential technical boundaries.

### 2. Grilling / requirement clarification (if needed)

If the user's initial description is vague or lacks concrete acceptance criteria, conduct a rigorous interview session with the user (following the principles of `/grill-with-docs`):

1. **Ask One Question at a Time**: Interview the user relentlessly about every aspect of the new issue until reaching a shared understanding.
2. **Wait for Feedback**: Present your recommended answer/approach for each question and wait for the user's confirmation before proceeding to the next question.
3. **Probe Specifics**: Challenge fuzzy language, establish clear boundaries between domain concepts, and explore concrete edge cases, error conditions, and out-of-scope items.

### 3. Fleshing out the issue & creating it on GitHub

Once the requirements are fully clarified and agreed upon:

1. **Synthesize Refined Specification**: Format the clarified requirements into a clean, comprehensive issue body. Ensure it includes:
   - A clear problem statement / summary
   - Detailed current behavior (or status quo)
   - Detailed desired behavior
   - Concrete, testable acceptance criteria
   - Specific out-of-scope items
2. **Confirm with User**: Present the drafted title and body of the issue to the user for final approval before creation.
3. **Create Issue on GitHub**: Use the GitHub CLI to create the issue:
   ```bash
   gh issue create --title "<issue-title>" --body "<issue-body>"
   ```
4. **Extract Issue Number**: Retrieve the newly created issue number from the output of the create command.

### 4. Triage & agent brief

At the end of the issue creation process, you MUST utilize the existing `/triage` skill workflow (refer to `skills/triage/SKILL.md` and `skills/triage/AGENT-BRIEF.md`) to properly classify and prepare the issue:

1. **Determine Triage Roles**: Identify the correct category role (`bug` or `enhancement`) and state role (`ready-for-agent`, `ready-for-human`, `needs-info`, `wontfix`, etc.) based on the triage skill guidelines.
2. **Apply Triage Labels**: Use the GitHub CLI to apply the correct canonical labels to the issue:
   ```bash
   gh issue edit <issue-number> --add-label "<category-role>,<state-role>"
   ```
3. **Post Agent Brief (If Applicable)**: If the issue is transitioned to `ready-for-agent` or `ready-for-human`, generate a durable, behavioral agent brief following the principles and template in `skills/triage/AGENT-BRIEF.md`. Post it as a comment on the issue:
   ```bash
   gh issue comment <issue-number> --body "<agent-brief-content>"
   ```
