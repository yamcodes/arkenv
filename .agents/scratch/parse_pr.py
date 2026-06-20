import json
import os

scratch_dir = "/Users/yamcodes/.gemini/antigravity/worktrees/arkenv/resolve-issue-1145/.agents/scratch"

def read_json(filename):
    with open(os.path.join(scratch_dir, filename), "r") as f:
        return json.load(f)

print("=== PR DETAILS ===")
pr = read_json("pr.json")
print(f"Title: {pr.get('title')}")
print(f"State: {pr.get('state')}")
print(f"User: {pr.get('user', {}).get('login')}")
print(f"Body:\n{pr.get('body')}\n")

print("=== REVIEWS ===")
reviews = read_json("reviews.json")
for r in reviews:
    print(f"Reviewer: {r.get('user', {}).get('login')}")
    print(f"State: {r.get('state')}")
    print(f"Body: {r.get('body')}")
    print("-" * 40)

print("\n=== COMMENTS ===")
comments = read_json("comments.json")
for c in comments:
    print(f"Author: {c.get('user', {}).get('login')}")
    print(f"Body: {c.get('body')}")
    print("-" * 40)

print("\n=== LINE COMMENTS / REVIEW COMMENTS ===")
rev_comments = read_json("review_comments.json")
for rc in rev_comments:
    print(f"Author: {rc.get('user', {}).get('login')}")
    print(f"File: {rc.get('path')}")
    print(f"Line (diff): {rc.get('original_line') or rc.get('line')}")
    print(f"Body: {rc.get('body')}")
    print("-" * 40)
