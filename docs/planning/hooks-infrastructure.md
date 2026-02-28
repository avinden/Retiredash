# RetireView — Hooks Infrastructure (Refined)

## Hook Architecture

```
File edit -> PostToolUse (post-edit.sh)
  Prettier, file length, any scan, secrets, float currency

Turn ends -> Stop (stop-check.sh) — LIGHTER
  Lint + typecheck only (NO build)
  Financial/parser tests if test files exist
  Console.log scanner (warning only)

git commit -> PreToolUse:Bash (pre-bash.sh)
  .env leak check, secrets scan
  Financial/parser test coverage enforcement
  Full test suite + full build
  Any type scan on staged diffs
  Supabase direct import check
  Auto-append findings to docs/review-findings.md
```

## What Each Layer Catches

| Problem | Post-Edit | Stop | Pre-Commit | Permission |
|---------|:---------:|:----:|:----------:|:----------:|
| Formatting | auto-fix | | | |
| File >200 lines | block | | | |
| `any` type | block | | warn | |
| Secrets | block | | block | |
| Float currency | warn | | | |
| Lint errors | | block | | |
| Type errors | | block | | |
| Build failures | | | block | |
| Failed tests | | block* | block | |
| console.log | | warn | warn | |
| .env staged | | | block | |
| Missing calc test | | | block | |
| Direct Supabase import | | | finding | |
| Reading .env | | | | deny |
| Writing .gitignore | | | | deny |

*Only if test files exist in calculations/parsers dirs.

## Permission Denials

- `.env` / `.env.*` — read and write denied
- `secrets/**` — read and write denied
- `.gitignore` — write denied

## Key Change from Original

Stop hook is lighter (no build) to keep turn feedback fast (~3-5s).
Full build only runs at pre-commit gate.
