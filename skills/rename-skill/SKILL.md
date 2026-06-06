---
name: rename-skill
description: Rename an existing agent skill (internal or external), updating its directory name, frontmatter name, and codebase-wide references. Use when the user requests to rename a skill, change a skill's identifier, or restructure a skill's folder.
metadata:
  internal: true
---

# Rename Skill

This skill guides you through safely and comprehensively renaming an existing skill (either internal or external) in the workspace.

## Workflow

### 1. Gather Information
- Identify the skill to rename (e.g., `old-name`).
- Determine the target name (e.g., `new-name`).
- Locate the skill directory. Typically, it will be under:
  - `skills/old-name` (internal skills)
  - `.agents/skills/old-name` (external/cache skills)

### 2. Rename the Directory
Rename the skill directory on the filesystem:
```bash
# For internal skills:
mv skills/<old-name> skills/<new-name>

# For external skills:
mv .agents/skills/<old-name> .agents/skills/<new-name>
```

### 3. Update Frontmatter and Attribution
Open `SKILL.md` in the newly renamed directory and update the `name` field in the frontmatter:
```yaml
---
name: <new-name>
...
---
```

Ensure you handle attribution and metadata correctly:
- **Preserve Attribution**: Do NOT delete existing attribution metadata in the frontmatter (e.g., `original_author`, `origin`). These track the provenance of the skill.
- **Update Maintainer (Optional)**: If you are taking over maintenance or updating the skill extensively, you can update or add the `author` field to yourself/your team, but keep `original_author` intact.
- **Update Internal Flag**: Ensure `metadata.internal: true` is set if it is an internal skill.
- **Update Credits Section**: If the bottom of `SKILL.md` contains a `## Credits` or `## Acknowledgements` section, preserve it and update any local folder/file links to reflect the renamed directory.

### 4. Search and Update References
Scan the codebase and docs for any references to the old skill name and update them to the new skill name. Look specifically for:
- Markdown links to the skill or its files (e.g., `[link](file:///.../skills/old-name/SKILL.md)`).
- References to the old name in descriptions or lists of available skills.
- Importing/requiring any scripts inside the skill.

You can find references using `grep` or the `grep_search` tool:
```bash
# Search for old name references in skills and docs
grep -rn "old-name" skills/ .agents/skills/ docs/ README.md
```

### 5. Verify the Rename
Ensure the renamed skill is healthy:
- Check that `skills/<new-name>/SKILL.md` exists and contains valid markdown and YAML frontmatter.
- If there are tests associated with the skill, verify they still run successfully.
- Check that all updated links/references point to valid files.
