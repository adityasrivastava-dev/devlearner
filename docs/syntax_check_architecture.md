---
name: Syntax Check Architecture
description: Moved from debounced API (600ms) to instant client-side heuristic checks; server errors shown only on Run/Submit
type: project
originSessionId: d8fadb0b-b8f5-4952-824a-ffbbcd3faff7
---
Syntax check moved from `POST /api/syntax-check` debounced every 600ms to client-side heuristic checking.

**Why:** LeetCode doesn't call a server API on every keystroke. The API call was slow (600ms delay + round-trip) and hit the server unnecessarily for every user keystroke.

**How to apply:** The `runClientChecks()` function in `CodeEditor.jsx` runs synchronously on every `onDidChangeModelContent`. It catches: unbalanced braces, unmatched parentheses (with comment/string-literal-aware scanning). Real compilation errors (javac) still appear when user clicks Run or Submit — `applyMarkers()` called from `ProblemSolveView` with the server response.

**Files changed (2026-04-16):**
- `frontend/src/components/editor/CodeEditor.jsx` — replaced debounced `codeApi.syntaxCheck()` with `runClientChecks()`, removed `debounce` import
- `onSyntaxChange` callback still exists but no longer receives `'checking'` state (no async)
