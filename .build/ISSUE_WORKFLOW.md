---
title: "Issue Workflow for Claude Code"
description: "Practical workflow for Claude Code to create, update, and manage GitHub issues while building. Integrates with ROADMAP.md, STATUS.md, and dashboard progress tracking."
---

# Issue Workflow for Claude Code

**Purpose:** Claude Code manages GitHub issues and ROADMAP/STATUS updates as you develop, keeping progress tracking objective and ROADMAP current.

## Prerequisites

- GitHub repository with GitHub CLI (`gh`) or GitHub API token configured
- `.build/` folder with ROADMAP.md, STATUS.md, NEXT.md, BACKLOG.md
- Claude Code has access to terminal and git commands

## Workflow Overview

```
You're developing → You discover complexity → You tell Claude Code
   ↓
Claude Code:
1. Creates GitHub issue(s)
2. Updates ROADMAP.md with new sub-phases
3. Updates STATUS.md with new progress calculation
4. Commits changes to git
5. Shows you the progress update
```

## How to Trigger This Workflow

### Scenario 1: Starting work on a phase

**You say to Claude Code:**
```
I'm starting Phase 1.0 (Audio capture setup). 
Let's set up the GitHub issues for this phase.
```

**Claude Code does:**
1. Reads ROADMAP.md, finds Phase 1.0 with sub-phases 1.0, 1.1, 1.2, 1.3
2. Creates 4 GitHub issues (one per sub-phase) with the issue template
3. Updates STATUS.md with initial progress (0% - 0 closed / 4 total)
4. Commits: "Initialize Phase 1.0 issues"

**Result:** You now have structured issues + updated STATUS.md

### Scenario 2: Discovering complexity mid-work

**You say to Claude Code:**
```
I'm building 1.0 (audio capture). I've realized we need to handle:
- Microphone permissions (tricky cross-browser)
- Real-time stream capture
- Error handling
These should be sub-issues under 1.0.
```

**Claude Code does:**
1. Creates sub-issues: 1.0.1, 1.0.2, 1.0.3
2. Updates ROADMAP.md:
   ```
   - 1.0 Audio capture setup
     - 1.0.1 Microphone permissions
     - 1.0.2 Real-time stream capture
     - 1.0.3 Error handling
   ```
3. Links sub-issues to parent #42 (1.0)
4. Recalculates progress: 0% (0/3 sub-issues closed)
5. Updates STATUS.md
6. Commits: "Discover Phase 1.0 sub-issues: permissions, stream capture, error handling"

**Result:** ROADMAP is current, issues reflect actual complexity, progress is honest

### Scenario 3: Completing a sub-task

**You say to Claude Code:**
```
I just finished the microphone permissions implementation.
Close issue #43 (1.0.1).
```

**Claude Code does:**
1. Closes GitHub issue #43
2. Adds comment: "Completed: Microphone permissions working across Chrome, Safari, Firefox. Code: [commits]"
3. Recalculates progress: 33% (1/3 sub-issues closed)
4. Updates STATUS.md
5. Commits: "Close issue #43: 1.0.1 Microphone permissions"

**Result:** Dashboard now shows 33% progress on Phase 1.0

### Scenario 4: Hitting a blocker

**You say to Claude Code:**
```
I found a bug: Chrome is introducing ~200ms latency in the audio buffer.
This blocks progress on 1.0.2 and 1.0.3.
Create a blocker issue for this.
```

**Claude Code does:**
1. Creates blocker issue: "1.0 - Chrome audio buffer latency"
2. Links to parent #42 (1.0)
3. Marks as "Blocked" in STATUS.md
4. Updates NEXT.md: "Blocked on: Chrome audio latency investigation (issue #XX)"
5. Commits: "Create blocker: Chrome audio buffer latency"

**Result:** Blocker is visible in GitHub and your NEXT.md

## Implementation Details

### GitHub Issue Creation via CLI

**Command Claude Code uses:**

```bash
gh issue create \
  --title "1.0.1 Microphone permissions" \
  --body "**ROADMAP Item:** Phase 1.0.1

**Goal:** Handle browser microphone permission flow.

**Acceptance Criteria:**
- [ ] Browser prompts user for mic permission
- [ ] Permission is cached
- [ ] User sees helpful message if denied
- [ ] Can revoke and restart

**Status:** In Progress" \
  --label "phase-1"
```

**Claude Code should:**
1. Generate the issue body from a template
2. Run `gh issue create` to create it
3. Capture the issue number from output
4. Update ROADMAP.md with the issue link

### Linking Issues

**After creating a sub-issue, link it to parent:**

```bash
gh issue edit 43 --add-label "phase-1.0"
# (or use gh to add issue link)
```

### Closing Issues

**When you complete work:**

```bash
gh issue close 43 --comment "Completed: Microphone permissions working. Tested on Chrome, Safari, Firefox. Code: abc123, def456"
```

### Reading Current Issues for Progress Calculation

**Claude Code fetches open/closed issues:**

```bash
gh issue list --label "phase-1" --json number,title,state
```

Output:
```json
[
  { "number": 42, "title": "1.0 Audio capture setup", "state": "OPEN" },
  { "number": 43, "title": "1.0.1 Microphone permissions", "state": "CLOSED" },
  { "number": 44, "title": "1.0.2 Real-time stream capture", "state": "OPEN" }
]
```

**Calculate progress:**
```
Closed: 1
Total: 3
Progress: 33%
```

## ROADMAP.md Updates

### When to update:
- **New sub-issues discovered** → Add to ROADMAP under current phase
- **Phase completed** → Mark "✅ Complete", move to next phase

### How Claude Code updates it:

1. Read current ROADMAP.md
2. Parse current phase section
3. Add new sub-phase lines
4. Write back to file
5. Commit

**Example:**

Before:
```markdown
## Current Phase: 1.0 Audio Capture Setup

- 1.0 Audio capture setup
```

After discovering sub-issues:
```markdown
## Current Phase: 1.0 Audio Capture Setup

- 1.0 Audio capture setup
  - 1.0.1 Microphone permissions (issue #43)
  - 1.0.2 Real-time stream capture (issue #44)
  - 1.0.3 Error handling (issue #45)
```

## STATUS.md Updates

### What to update:
- **progress %** — Recalculate based on closed issues
- **lastTouched** — Update to today
- **blockers** — Add/remove based on GitHub issue status
- **status** — Change to "blocked" if blocker exists, "in-progress" if working, "completed" if all issues closed

### How Claude Code updates it:

1. Read current STATUS.md (extract frontmatter)
2. Fetch GitHub issues for current phase
3. Calculate: progress % = (closed / total) × 100
4. Update frontmatter fields
5. Write back to file
6. Commit

**Example:**

Before:
```yaml
progress: 0
status: in-progress
blockers: None yet
```

After closing 1.0.1:
```yaml
progress: 33
status: in-progress
blockers: Chrome audio buffer latency (issue #45, blocks 1.0.2 and 1.0.3)
```

## Git Commits

**Claude Code should commit after each workflow step:**

**After creating issues:**
```bash
git add ROADMAP.md STATUS.md
git commit -m "Initialize Phase 1.0 issues (1.0, 1.1, 1.2, 1.3)"
```

**After discovering sub-issues:**
```bash
git add ROADMAP.md STATUS.md
git commit -m "Discover Phase 1.0 sub-issues: permissions, stream capture, error handling"
```

**After closing an issue:**
```bash
git add STATUS.md
git commit -m "Close issue #43: 1.0.1 Microphone permissions complete"
```

**Commit message format:**
```
[Action] [What changed]

- Details about the change
- Issue numbers if applicable
```

## Safety Checks

**Claude Code should verify:**

1. **ROADMAP.md exists and is valid YAML** before updating
2. **Issue numbers match** between GitHub and ROADMAP.md
3. **All sub-issues under a phase are linked** to parent issue
4. **STATUS.md frontmatter is valid** before writing
5. **Progress calculation is correct** (closed ÷ total = %)

If any check fails, **stop and ask for clarification** rather than corrupting files.

## Workflow Commands Reference

| Action | Command |
|--------|---------|
| Create issue | `gh issue create --title "..." --body "..."` |
| List issues for phase | `gh issue list --label "phase-X" --json number,title,state` |
| Close issue | `gh issue close [number] --comment "..."` |
| Add label | `gh issue edit [number] --add-label "phase-X"` |
| View issue | `gh issue view [number]` |

## Example: Full Session Workflow

**Start of session:**

You: "Let's work on Phase 1 today. I'll start with 1.0 (Audio capture setup)."

Claude Code:
1. Creates 4 issues (1.0, 1.1, 1.2, 1.3)
2. Updates ROADMAP.md
3. Sets STATUS.md to 0% progress
4. Commits

---

**During development:**

You: "I realize the permissions piece is complex. Let me break it into: 1.0.1 (permissions), 1.0.2 (stream capture), 1.0.3 (error handling)."

Claude Code:
1. Creates 3 sub-issues
2. Updates ROADMAP.md with hierarchy
3. Recalculates progress (0% - 0/3 closed)
4. Commits

---

**You finish permissions:**

You: "Done with permissions. Close #43."

Claude Code:
1. Closes issue #43
2. Recalculates: 33% (1/3 closed)
3. Updates STATUS.md
4. Commits

---

**You hit a bug:**

You: "Chrome is laggy. Create a blocker for this."

Claude Code:
1. Creates blocker issue
2. Updates STATUS.md: blockers = "Chrome latency"
3. Commits

---

**You fix the bug:**

You: "Fixed it! Close the blocker."

Claude Code:
1. Closes blocker issue
2. Updates STATUS.md: blockers = "None"
3. Commits

---

**End of session:**

Claude Code (automatically):
1. Summarizes progress for SESSION_START.md
2. Shows final % for phase 1.0
3. Lists what's blocking next phase

## When Claude Code Should Ask for Help

Stop and ask if:
- ROADMAP.md format is broken or unparseable
- GitHub credentials are missing or invalid
- An issue number doesn't match between GitHub and ROADMAP
- User gives contradictory instructions (e.g., "close issue #43" but it's already closed)
- Progress calculation doesn't make sense
- User wants to change ROADMAP structure in a way that breaks the hierarchy

## Integration with Dashboard

Once this workflow is running:
- Dashboard reads STATUS.md `progress` field
- Dashboard fetches GitHub issues to verify progress
- Both sources should match (if Claude Code is updating correctly)
- Discrepancies trigger a warning

---

**This workflow keeps your ROADMAP living, your progress objective, and your GitHub issues synchronized with your actual development.**
