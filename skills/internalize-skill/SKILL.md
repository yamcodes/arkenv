---
name: internalize-skill
description: "Move newly installed skills from '.agents/skills/' to the project's root 'skills/' directory and mark them as internal by adding 'internal: true' to their metadata in 'SKILL.md'. Use this skill whenever a new skill is installed into '.agents/skills/' and needs to be promoted to a project-internal skill."
metadata:
  internal: true
---

# Internalize Skill

This skill automates the process of moving externally installed skills to the project's internal `skills/` directory and tagging them as internal.

## Workflow

1. **Identify Target Skills:**
   - Check the `.agents/skills/` directory for subdirectories.
   - If the user explicitly named a skill (e.g., "internalize the research skill"), focus only on that one.
   - If the user was vague (e.g., "internalize the new skills"):
     - If there is **only one** skill in `.agents/skills/`, proceed with that one.
     - If there are **multiple** skills, you **MUST** ask the user for clarification (e.g., "I found multiple skills: X, Y, and Z. Which ones should I internalize?"). Do not make assumptions.
2. **Move to Internal:** Move each identified and confirmed skill directory to the root `skills/` directory.
3. **Update Metadata:** For each moved skill, update its `SKILL.md` file to include `internal: true` under a `metadata` key in the YAML frontmatter.

## Implementation Details

The skill should rely on standard bash commands for efficiency and portability.

### Moving Skills

```bash
mv .agents/skills/<skill-name> skills/
```

### Updating Metadata

Use `awk` to surgically insert the metadata if it doesn't exist. The logic should:

- Find the second `---` (end of frontmatter).
- Check if `metadata:` already exists within the frontmatter.
- If not, insert `metadata:` and `  internal: true` before the second `---`.
- If `metadata:` exists but `internal: true` is missing, add it under `metadata:`.

Example `awk` command for insertion:

```bash
awk '
  /^---$/ { frontmatter_count++ }
  /^metadata:/ { has_metadata = 1 }
  frontmatter_count == 2 && !done && !has_metadata {
    print "metadata:"
    print "  internal: true"
    done = 1
  }
  { print }
' SKILL.md > SKILL.md.tmp && mv SKILL.md.tmp SKILL.md
```

## Safety Checks

- Ensure `skills/` directory exists before moving.
- Only process directories in `.agents/skills/`.
- Verify `SKILL.md` exists before attempting to edit it.
