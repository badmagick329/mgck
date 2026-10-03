# Repository instructions

## Coding

- Replace obsolete internal APIs and patterns outright; keep backward compatibility only when the user asks for it.
- Validate at trust boundaries: user input, external APIs, files, network data, third-party software. Inside them, trust internal invariants and fail fast.
- Write tests that would catch a real regression in behaviour.

## Documentation

- Comments and docstrings on non-trivial code record the why: intent, design rationale, constraints, invariants.
- Read `notes/PROJECT_UNDERSTANDING.md` for project decisions and working agreements when present. Private notes are ignored by Git and may be absent in a fresh clone.
- For Security Cloud findings, security remediation, or resuming this review, start at `notes/SECURITY_FINDINGS_TRIAGE.md`. It records all 20 findings, evidence, deployment corrections, unresolved conditions, and the handoff state.

## Responses

- Answer first, then stop. Add a caution or alternative only when it prevents a real mistake. Write terse, clipped prose; use bullets only for content that is actually a list.
