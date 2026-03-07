# Claude Code Instructions — Code Projects

Extends the global ~/.claude/CLAUDE.md. These instructions apply to software/code projects only.

---

## 1. Code Health Check

Run after every coding session and before committing. Catches common issues, formatting problems, and basic quality concerns.

### When to Use
- After every session before committing
- Before deploying to production
- For a quick sanity check on code quality
- When onboarding code from any source

### Step 1: Detect Language/Framework

Check what's in the current directory:
```bash
ls -la
```
- `requirements.txt`, `pyproject.toml`, `*.py` → Python
- `package.json`, `*.js`, `*.ts`, `*.jsx`, `*.tsx` → JavaScript/TypeScript

### Step 2: Run Automated Checks

**Python:**
```bash
pip install ruff black mypy bandit --break-system-packages
ruff check .
black --check .
mypy . --ignore-missing-imports
bandit -r . -ll
```

**JavaScript/TypeScript:**
```bash
npx eslint . --ext .js,.jsx,.ts,.tsx
npx prettier --check .
npm audit
```

**Any project:**
```bash
# Find large files
find . -type f \( -name "*.py" -o -name "*.js" -o -name "*.ts" \) -exec wc -l {} \; | sort -rn | head -10

# Find TODOs
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.py" --include="*.js" --include="*.ts" .
```

### Step 3: Check for Common Issues
```bash
# Hardcoded secrets
grep -r -i -n \
  -e "api_key\s*=\s*['\"][^'\"]\+" \
  -e "password\s*=\s*['\"][^'\"]\+" \
  -e "secret\s*=\s*['\"][^'\"]\+" \
  --include="*.py" --include="*.js" --include="*.ts" . 2>/dev/null | \
  grep -v "YOUR_API_KEY\|REPLACE_ME\|example\|placeholder"

# .env tracked in git
if [ -d ".git" ]; then
  git ls-files | grep -E "\.env$" && echo "⚠️ WARNING: .env file is tracked in git!" || echo "✓ No .env files tracked"
fi
```

### Output Format

```
## Code Health Report

**Health Score: [X]/100 (Grade: [A-F])**

### Critical Issues ❌
### Warnings ⚠️
### Info 💡
### Quick Wins
### Recommendations
```

**Health Score:**
- 90–100 (A): No errors, minor warnings only
- 70–89 (B): Some warnings, no critical issues
- 50–69 (C): Multiple warnings or few errors
- 30–49 (D): Many issues or some critical problems
- 0–29 (F): Critical issues present

### Red Flags — Always Report
- Hardcoded credentials or API keys
- `.env` file tracked in git
- No error handling on external API calls
- SQL queries built with string concatenation
- Passwords stored in plain text
- Missing authentication on sensitive endpoints

---

## 2. Security Audit

Run before ANY production deployment and when handling user data.

### When to Use
- ALWAYS before deploying to production
- When handling user data (especially PII or financial)
- After implementing authentication or authorisation
- When integrating third-party APIs or libraries

### Step 1: Automated Scans

**Python:**
```bash
pip install bandit safety pip-audit --break-system-packages
bandit -r . -ll -f txt
safety check
pip-audit --desc
```

**JavaScript/TypeScript:**
```bash
npm audit --json
npx eslint . --rule 'no-eval: error'
npx secretlint "**/*"
```

**Universal:**
```bash
# Secrets scan
grep -r -i -n \
  -e "api[_-]?key\s*[=:]\s*['\"][^'\"]{8,}" \
  -e "password\s*[=:]\s*['\"][^'\"]{8,}" \
  --include="*.py" --include="*.js" --include="*.ts" .

# .env in git
git ls-files | grep -E "\.env$"

# Sensitive files
find . -name "*.pem" -o -name "*.key" -o -name "*.p12" 2>/dev/null
```

### Step 2: Manual Checklist

**🔐 Secrets & Credentials**
- [ ] No API keys in code
- [ ] No passwords in code
- [ ] `.env` file in `.gitignore`
- [ ] `.env.example` has fake values only
- [ ] Secrets loaded from environment variables

**🛡️ Input Validation**
- [ ] All user inputs validated
- [ ] Parameterised database queries (no string concatenation)
- [ ] No `eval()` or `exec()` with user input
- [ ] HTML escaped before rendering

**👤 Authentication & Authorisation**
- [ ] Passwords hashed with bcrypt/argon2
- [ ] Session tokens cryptographically secure
- [ ] Users can only access their own data
- [ ] Admin functions require admin role
- [ ] CSRF protection on state-changing operations

**🌐 Network & Transport**
- [ ] HTTPS enforced
- [ ] CORS configured properly (not `*`)
- [ ] No sensitive data in URLs
- [ ] Cookies have `Secure` and `HttpOnly` flags

**📦 Dependencies**
- [ ] No known vulnerable dependencies
- [ ] Lock file committed (package-lock.json, poetry.lock)

### Risk Scoring

- **CRITICAL (90–100)**: Hardcoded production credentials, SQL injection, auth bypass → DO NOT DEPLOY
- **HIGH (70–89)**: Vulnerable dependencies, missing auth on sensitive endpoints, weak password hashing
- **MEDIUM (40–69)**: Missing CSRF, verbose error messages, missing rate limiting
- **LOW (0–39)**: Minor best practice violations

### Output Format

```
# Security Audit Report

**Risk Score: [X]/100** ([LOW/MEDIUM/HIGH/CRITICAL])

## Executive Summary
[2-3 sentences]

## 🚨 CRITICAL Issues
## ⚠️ HIGH Severity
## 📋 MEDIUM Severity
## 💡 LOW Severity

## ✅ Passing Security Checks

## Recommended Actions (Priority Order)
1.
2.
3.
```

### Emergency Response

If CRITICAL issues found:
1. Stop deployment immediately
2. Don't commit changes until fixed
3. If already deployed, consider taking offline
4. Fix before anything else
5. Re-audit after fix

---

## 3. Architecture Review

Run when building new features, refactoring, or when code feels hard to change.

### When to Use
- Before scaling up (more users, more features)
- When code feels messy or hard to change
- When onboarding new developers
- When technical debt is accumulating

### Step 1: Map the Architecture

```bash
# Directory structure
find . -type d | grep -v node_modules | grep -v __pycache__ | grep -v .git | head -40

# Find large files
find . -name "*.py" -o -name "*.js" -o -name "*.ts" | xargs wc -l 2>/dev/null | sort -rn | head -20

# Python dependencies between files
grep -r "^import\|^from" --include="*.py" . | sort | uniq | head -40

# JavaScript imports
grep -r "^import\|require(" --include="*.js" --include="*.ts" . | head -40
```

### Step 2: Architecture Checklist

**📂 Organisation & Structure**
- [ ] Clear folder structure
- [ ] Consistent naming conventions
- [ ] No circular dependencies
- [ ] Configuration separate from code

**🎯 Separation of Concerns**
- [ ] Business logic separate from presentation
- [ ] Data access separate from business logic
- [ ] Each file/module has single responsibility

**🔌 Dependencies & Coupling**
- [ ] Low coupling between modules
- [ ] External dependencies abstracted

**📈 Scalability**
- [ ] No hard-coded limits
- [ ] Stateless where possible
- [ ] Async operations for I/O

### Anti-Pattern Detection

**God Object / God File:**
```bash
find . -name "*.py" -o -name "*.js" | xargs wc -l | awk '$1 > 500' | sort -rn
```

**Tight Coupling:**
```bash
# Direct DB calls scattered through code
grep -r "db\.\|session\.\|query(" --include="*.py" . | grep -v "models.py\|database.py\|db_utils.py" | wc -l
```

### Output Format

```
# Architecture Review Report

**Architecture Score: X/100**

## Architecture Pattern
Detected: [e.g., Layered MVC]
Appropriateness: [Good fit / Acceptable / Problematic]

## ✅ Strengths
## ⚠️ Concerns
## ❌ Critical Issues

## Anti-Patterns Detected
[Anti-pattern name, severity, location, fix strategy, effort]

## Technical Debt Estimate
Current: [High/Medium/Low]
Time to debt crisis: [Estimate]

## Refactoring Priorities
High / Medium / Low
```

---

## 4. Performance Check

Run when the app feels slow, before scaling, or when server costs are rising unexpectedly.

### Common Anti-Patterns to Detect

**N+1 Queries:**
```bash
# Python/Django
grep -A 5 "for.*in.*\.all()\|for.*in.*\.filter(" --include="*.py" -r . | grep -B 5 "\.get(\|\.filter(\|\.all()"
```

**Missing Indexes:**
```bash
grep -r "filter.*=\|WHERE.*=" --include="*.py" --include="*.js" . | grep -v "id=\|pk=" | head -20
```

**Large Data Transfers:**
```bash
grep -r "\.all()\|SELECT \*" --include="*.py" . | grep -v "\.filter(\|WHERE\|LIMIT" | head -20
```

### Performance Checklist

- [ ] API endpoints respond in < 200ms average
- [ ] Database queries complete in < 100ms
- [ ] No queries in loops (N+1 problems)
- [ ] Appropriate pagination (default limit: 20–100)
- [ ] Indexes on foreign keys and frequently filtered fields
- [ ] No loading entire tables into memory
- [ ] Caching for expensive operations

### Output Format

```
# Performance Analysis Report

**Performance Score: X/100**
**Performance Grade: [A/B/C/D/F]**

## 🚨 CRITICAL BOTTLENECKS (Fix Immediately)
[Problem, location, current performance, expected after fix, fix, effort]

## ⚠️ SIGNIFICANT ISSUES
## 💡 OPTIMISATIONS

## Quick Wins (High Impact, Low Effort)
1.
2.
3.

## Scalability Estimate
Current capacity: ~X concurrent users
Limiting factor: [Database / Memory / CPU]
```

---

## 5. Code Explainer

Use when reviewing code from a session, onboarding to a codebase, or explaining code to non-technical stakeholders.

### Multi-Level Explanation

**Level 1: Executive Summary (30 seconds)**
2–3 sentences: what the code does, why it exists, any critical concerns.

**Level 2: Functional Explanation (5 minutes)**
Plain English walkthrough — step-by-step what happens, key decisions, integration points, edge cases.

**Level 3: Technical Deep Dive (15+ minutes)**
Code structure and patterns, design decisions, performance characteristics, suggested improvements.

### Use Analogies

Instead of: "This implements a binary search tree for O(log n) lookup"
Say: "This organises data like a phone book — sorted so you can find names quickly by opening to the middle"

Instead of: "This is a race condition where concurrent threads modify shared state"
Say: "This is like two people editing the same Google Doc at once — their changes can overwrite each other"

### Output Format

```
# Code Explanation

## 📋 Executive Summary
[2–3 sentences]

## 🎯 What This Code Does
### Primary Purpose
### Key Functionality

## 🔄 How It Works (Step-by-Step)
[Numbered steps with plain language]

## ⚠️ Potential Issues & Risks
### Critical Issues 🚨
### Important Concerns ⚠️
### Minor Notes 💡

## 💡 Improvement Suggestions
### Quick Wins
### Recommended Refactoring

## 🎯 In Plain English
"This code is like a [analogy]. When [trigger], it [main action]."
```

---

## 6. QA Workflow — When to Use What

### Quick Reference

| Time Available | Must Do | Should Do |
|----------------|---------|-----------|
| 5 min | Code Explainer (summary) | Code Health Check |
| 15 min | Code Explainer + Security Audit | Code Health Check |
| 30 min | Code Explainer + Security Audit + Code Health Check | Architecture Review |
| 60+ min | All five skills | — |

### Pre-Deployment Checklist (Must Have)
- [ ] All CRITICAL issues fixed
- [ ] No security vulnerabilities > LOW
- [ ] Code Health score > 60
- [ ] All automated checks passing
- [ ] You understand what the code does

### Issue Severity

- 🚨 **CRITICAL**: Stop everything, fix now, don't deploy
- ⚠️ **HIGH**: Fix before deploying
- 📋 **MEDIUM**: Schedule fix, track as tech debt
- 💡 **LOW**: Fix when convenient

### Decision Tree

```
Code from session
      ↓
Do I understand what it does? → NO → Code Explainer
      ↓ YES
Run Code Health Check
      ↓
Critical issues? → YES → Fix → Re-check
      ↓ NO
Going to production? → NO → DONE
      ↓ YES
Run Security Audit
      ↓
HIGH/CRITICAL risks? → YES → Fix → Re-audit
      ↓ NO
Run Architecture Review + Performance Check
      ↓
✅ APPROVED FOR DEPLOYMENT
```
---

## 7. Issue Management During Development
See `.build/ISSUE_WORKFLOW.md` for how to structure and manage GitHub issues while building this project.
```