import os
import json

def grade(output_dir, base_dir):
    skill_md_path = os.path.join(output_dir, "skills/dummy-skill/SKILL.md")
    results = []
    
    # Assertion 1: directory exists in skills/ (in the workspace output)
    exists_in_skills = os.path.exists(os.path.join(output_dir, "skills/dummy-skill"))
    results.append({
        "text": "The directory 'skills/dummy-skill' exists",
        "passed": exists_in_skills,
        "evidence": f"Found at {skill_md_path}" if exists_in_skills else "Not found in output"
    })
    
    # Assertion 2: SKILL.md contains 'metadata:'
    has_metadata = False
    if os.path.exists(skill_md_path):
        with open(skill_md_path, "r") as f:
            content = f.read()
            if "metadata:" in content:
                has_metadata = True
    
    results.append({
        "text": "SKILL.md contains 'metadata:'",
        "passed": has_metadata,
        "evidence": "Found 'metadata:' in SKILL.md" if has_metadata else "Could not find 'metadata:'"
    })
    
    # Assertion 3: SKILL.md contains 'internal: true'
    has_internal = False
    if os.path.exists(skill_md_path):
        with open(skill_md_path, "r") as f:
            content = f.read()
            if "internal: true" in content:
                has_internal = True
    
    results.append({
        "text": "SKILL.md contains 'internal: true'",
        "passed": has_internal,
        "evidence": "Found 'internal: true' in SKILL.md" if has_internal else "Could not find 'internal: true'"
    })
    
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    
    return {
        "expectations": results,
        "summary": {
            "passed": passed_count,
            "failed": total_count - passed_count,
            "total": total_count,
            "pass_rate": passed_count / total_count if total_count > 0 else 0
        }
    }

workspace = "/Users/yamcodes/code/arkenv-main-for-real/internalize-skill-workspace/iteration-1/eval-1"
for run in ["with_skill", "without_skill"]:
    run_dir = os.path.join(workspace, run)
    output_dir = os.path.join(run_dir, "outputs")
    grading_result = grade(output_dir, "/Users/yamcodes/code/arkenv-main-for-real")
    
    # Save to the run-1 directory as expected by aggregator
    run_1_dir = os.path.join(run_dir, "run-1")
    os.makedirs(run_1_dir, exist_ok=True)
    with open(os.path.join(run_1_dir, "grading.json"), "w") as f:
        json.dump(grading_result, f, indent=2)
