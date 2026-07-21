# Generate a New Home Panel — Progress Ledger

Branch: feature/generate-home-panel
Plan: docs/superpowers/plans/2026-07-20-generate-home-panel.md
Merge base: b26605e
Base (before Task 1): 36287f9

Note: earlier uncommitted dashboard work (this session) committed standalone as 794f6e5 to keep feature diffs clean.

Task 1: complete (commits 6621ae6 + fix 075c975, review clean — spec ✅; Critical dead-code guard removed, comment fixed, weak test strengthened; deterministic, no dupes/invalid ids; 6/6 tests, tsc clean)
Task 2: complete (commit 7b5e2f4, review clean — spec ✅, quality Approved; exact prop signature, disabled-gating correct, data-testid + accessible names present. 3 Minors deferred to final review: (a) textarea has no explicit label/aria-label; (b) redundant guard in handleGenerate (harmless — Regenerate isn't disabled-gated); (c) hardcoded w-[380px] matches codebase convention. tsc clean.)
Task 3: complete (commits 1c89d04 + test-strengthen 4bf08a2, review clean — spec ✅, quality Approved; non-destructive preview verified (setLayout only in applyPreview, activeLayout = previewLayout ?? layout in both columns + drop-zone counts, discard lossless). Weak Apply/Discard tests strengthened to assert widget-order changed-on-apply / unchanged-on-discard with non-empty guard. 16/16 Home tests, 55/55 full suite, tsc clean.)
  - Deferred note for final review: edit-mode-while-previewing is allowed (activeLayout still uses preview) but the Preview badge hides in the edit branch. Spec is silent; behavior is reasonable (edit mode is also non-destructive until Apply). Low priority.

Final whole-branch review (Opus, b26605e..HEAD, src only): CHANGES NEEDED → fixed in 21fe752.
  - BLOCKER (Important): editing while a preview was active let moveWidget/removeWidget/addWidget call setLayout on the REAL layout using preview-derived indices → silent corruption + persisted, breaking lossless-discard. FIXED: Customize button now hidden while previewLayout !== null (modes cannot overlap); + regression test "hides Customize while a generate preview is active".
  - Minor: strengthened vacuous "core widgets" test to protect the +0.5 nudge tie-break; changed HEALTH_STATE_META icon type typeof BadgeCheck → LucideIcon.
  - Confirmed clean: generator invariants (all 10 valid ids, 5/5 split, no dupes, deterministic), preview/apply contract (setLayout only in applyPreview), data-shape refactor consumers all updated, integration tests meaningful.
  - Accepted-as-logged Minors (no fix): textarea lacks explicit label; redundant handleGenerate guard; "Generate" reflows all 10 widgets rather than curating a subset (copy slightly oversells — mock-acceptable).
  Gates after fix: 57/57 tests, tsc clean.
