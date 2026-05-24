---
name: internalize-skill
description: "Move newly installed skills from '.agents/skills/' to the project's root 'skills/' directory, with options to rename and attribute them, and mark them as internal. Use this skill whenever a new skill is installed and needs to be promoted, renamed, or attributed as a project-internal skill."
metadata:
  internal: true
---

# Internalize skill

This skill automates the process of moving externally installed skills to the project's internal `skills/` directory, tagging them as internal, and optionally renaming and attributing them.

## Workflow

1. **Identify Target Skills & Options:**
   - Check the `.agents/skills/` (or `.agent/skills/`) directory for subdirectories.
   - If the user explicitly named a skill (e.g., "internalize the research skill"), focus only on that one.
   - If the user was vague, clarify which skill to target.
   - **Ask the user** if they would like to:
     - Rename the skill (e.g., change `creating-changesets` to `arkenv-changesets`).
     - Add attribution details (e.g., `original_author`, original `origin` repository url).

2. **Move/Rename to Internal:**
   - Move the identified skill directory to `skills/<new-name>` (where `<new-name>` defaults to the original name if no rename is requested).

3. **Update Frontmatter & Metadata:**
   - Update the `name` field in the `SKILL.md` frontmatter to `<new-name>`.
   - Update the `metadata` block to include `internal: true`.
   - If attribution details were specified, add:
     - `original_author`: The original author's name.
     - `origin`: The URL or GitHub repository of the original skill.
     - `author`: The current maintainer or team name.

4. **Append Markdown Credits (Optional):**
   - If the skill was renamed or customized, append a `## Credits` or `## Acknowledgements` section at the bottom of the skill's `SKILL.md` file linking back to the original source.

## Implementation details

The skill should rely on standard bash commands for efficiency and portability.

### Moving & renaming skills

```bash
# If keeping the same name:
mv .agents/skills/<old-name> skills/

# If renaming:
mv .agents/skills/<old-name> skills/<new-name>
```

### Updating metadata

Use code edits or `awk` to update `SKILL.md` frontmatter. The logic should:

- Update `name: <new-name>` at the top.
- Insert or merge the `metadata` block to ensure `internal: true`, plus any specified attribution fields.

Example of expected final frontmatter structure:

```yaml
---
name: arkenv-changesets
description: Creates changesets for semantic versioning.
metadata:
  author: Yam Borodetsky
  original_author: Ollie Shop
  origin: github.com/ollieshop/creating-changesets
  version: 1.0.0
  internal: true
---
```

## Safety checks

- Ensure the root `skills/` directory exists before moving.
- Verify `SKILL.md` exists in the target directory before attempting to edit it.
- Do not overwrite existing internal skills under `skills/` unless explicitly confirmed by the user.
