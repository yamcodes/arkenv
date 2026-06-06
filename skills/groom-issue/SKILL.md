---
name: groom-issue
description: Groom a poorly written issue by grilling the user to clarify requirements, updating the issue on GitHub via the gh cli, and utilizing the triage skill to apply the correct label and add an agent brief if necessary. Use when the user wants to groom, flesh out, or clarify a poorly written issue.
metadata:
  internal: true
---

# Groom issue

This skill takes a poorly written, ambiguous, or incomplete issue, conducts an interactive grilling session with the user to clarify requirements, updates the issue on GitHub using the GitHub CLI (`gh`), and utilizes the existing `/triage` skill workflow to apply the correct canonical labels and post an authoritative agent brief.

## Trigger

Use this skill whenever the user says `/groom-issue <number>` or asks to "groom", "clarify", "flesh out", or "improve" a poorly written issue.

## Workflow

### 1. Context gathering & initial assessment

Before asking any questions, you MUST examine the current state of the issue and the surrounding codebase.

1. **Retrieve Issue Details**: Fetch the issue context, including title, body, comments, and labels using the GitHub CLI:
   ```bash
   gh issue view <issue-number> --json title,body,labels,comments
   ```
2. **Analyze Requirements**: Evaluate the issue description and existing comments. Identify gaps, ambiguities, missing edge cases, unclear desired behavior, or lacking acceptance criteria.
3. **Explore Codebase**: Explore the repository to understand the domain model and existing implementations relevant to the issue. Refer to the project's domain glossary (`docs/CONTEXT.md`), ADRs (`docs/adr/`), and prior rejections (`.out-of-scope/*.md`).

### 2. Grilling / requirement clarification (if needed)

If the issue is vague, poorly written, or lacks concrete acceptance criteria, conduct a rigorous interview session with the user (following the principles of `/grill-with-docs`):

1. **Ask One Question at a Time**: Interview the user relentlessly about every aspect of the issue until reaching a shared understanding.
2. **Wait for Feedback**: Present your recommended answer/approach for each question and wait for the user's confirmation before proceeding to the next question.
3. **Probe Specifics**: Challenge fuzzy language, establish clear boundaries between domain concepts, and explore concrete edge cases and error conditions.

### 3. Fleshing out the issue on GitHub

Once the requirements are fully clarified and agreed upon:

1. **Synthesize Refined Specification**: Format the clarified requirements into a clean, comprehensive issue body. Ensure it includes:
   - A clear problem statement
   - Detailed desired behavior
   - Concrete, testable acceptance criteria
2. **Update Issue on GitHub**: Use the GitHub CLI to update the issue body (and title if appropriate):
   ```bash
   gh issue edit <issue-number> --body "<refined-issue-body>"
   ```

### 4. Triage & agent brief

At the end of the grooming process, you MUST utilize the existing `/triage` skill workflow (refer to `skills/triage/SKILL.md` and `skills/triage/AGENT-BRIEF.md`) to properly classify and prepare the issue:

1. **Determine Triage Roles**: Identify the correct category role (`bug` or `enhancement`) and state role (`ready-for-agent`, `ready-for-human`, `needs-info`, `wontfix`, etc.) based on the triage skill guidelines.
2. **Apply Triage Labels**: Use the GitHub CLI to apply the correct canonical labels to the issue:
   ```bash
   gh issue edit <issue-number> --add-label "<category-role>,<state-role>"
   ```
   *(Note: Remove any conflicting or outdated triage state labels if necessary).*
3. **Post Agent Brief (If Applicable)**: If the issue is transitioned to `ready-for-agent` or `ready-for-human`, generate a durable, behavioral agent brief following the principles and template in `skills/triage/AGENT-BRIEF.md`. Post it as a comment on the issue:
   ```bash
   gh issue comment <issue-number> --body "<agent-brief-content>"
   ```
   *(If transitioned to `needs-info` or `wontfix`, follow the corresponding comment or closing procedures defined in the triage skill).*
