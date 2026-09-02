# Implementation Plan — Platform Upgrade v3.0

This plan sequences the upgrades (topic-wise diagnostics, visual roadmap, mobile-first design/theme, hardened offline chatbot, and supporting features) into buildable phases. Each phase is independently shippable — you can stop after any phase and still have a working, improved product.

---

## Phase 0 — Groundwork (no user-facing change)
**Goal:** Prep the data layer so later phases don't require rework.

| Task | Details | Status |
|---|---|---|
| Extend `student_concept_mastery` usage | Confirm mastery is tracked at concept-level in queries the API returns — ensure concept-level granular data is surfaced to the roadmap & graph layers. | Ready |
| Expand question bank metadata | Tag every question with `chapter_id` and `topic_id`, not just `subject` + `concept_id`, so drill-down tests can query by chapter. | Ready |
| Add `test_tier` field to `assessment_attempts` | Values: `SCREENER`, `TOPIC_DRILL`, `FULL_SCAN` — needed for Phase 1. | Ready |
| Expose DAG as JSON endpoint | Verify `GET /api/curriculum/graph/{exam_id}` returns mastery-annotated nodes ready for frontend visualization (needed for Phase 3). | Verified |

**Effort:** 2-3 days. **Blocking for:** everything else.

---

## Phase 1 — Tiered Diagnostic Engine (topic-wise testing)
**Goal:** Move from flat 9-question test to adaptive subject → chapter drill-down.

1. Keep existing 9-Q **Screener** as Tier 1 (no change to entry flow).
2. After grading, add a rule: if any subject accuracy < 60% → flag subject as `WEAK`.
3. New endpoint: `POST /api/assessments/start-drill?student_id={id}&subject={s}` — selects 4-5 PYQ questions per weak chapter within that subject (reuse `question_selector.py`, add chapter-level balancing logic).
4. New `Full Syllabus Deep Scan` mode (30-45 Qs, all chapters) — same selector, just `test_tier=FULL_SCAN`, no subject filtering.
5. Update grading pipeline to write mastery updates at `topic_id` granularity, not just `concept_id` (cascades via BKT, confirm topic rollups display correctly).

**Effort:** 4-6 days. **Depends on:** Phase 0.  
**Test:** pytest cases for drill-down selection balancing (mirroring existing 12-test suite pattern).

---

## Phase 2 — Hardened Offline Chatbot
**Goal:** Make the deterministic engine the primary path, not a fallback, with graceful handling of unclear input.

1. Build `IntentClassifier` module:
   - Keyword/pattern rules first (`"mistake"`, `"wrong"`, `"analyze"` → `ANALYZE_MISTAKES`, etc.)
   - Fuzzy match fallback using `rapidfuzz` for typos/rephrasing (confidence threshold ~0.6).
2. Define fixed intent set: `ANALYZE_MISTAKES`, `EXPLAIN_ROADMAP`, `STRATEGY_TIPS`, `EXPLAIN_CONCEPT`, `UNKNOWN`.
3. On `UNKNOWN` or low-confidence match: **never guess** — return a structured clarification response with quick-prompt chips (reuse existing chip UI).
4. Convert each intent handler into a **template + slot-fill** function pulling from `StudentAttemptItem` / roadmap data (formalize into reusable templates).
5. Keep the Ollama hook as an optional "polish pass" over the deterministic template output (rephrase only, never replace underlying facts) — preserves zero-API-required guarantee while allowing a natural voice when Ollama is present.
6. Add input sanitization: strip/limit message length, reject empty submits client-side, rate-limit chat calls per session.

**Effort:** 5-7 days. **Depends on:** current data model.  
**Test:** unit tests per intent with 5-10 phrasing variants each, including typos and unrelated input.

---

## Phase 3 — Visual Roadmap
**Goal:** Replace step-list roadmap with a mastery-driven visual.

1. Frontend: add a lightweight graph render (D3 force-layout or a sunburst) fed by the Phase 0 DAG JSON endpoint. Node color = mastery bucket (weak/developing/strong), node size = exam weightage, red badge = broken prerequisite.
2. Add a **heatmap grid view** as the mobile-friendly alternative (rows = chapters, columns = mastery %, confidence, last-practiced) — same data, cheaper to render on small screens.
3. Dashboard: progress ring (% roadmap complete) + next 3 actions as cards.
4. Desktop shows graph view by default; mobile shows heatmap/card view by default (viewport-based switch).

**Effort:** 6-8 days (frontend-heavy). **Depends on:** Phase 0 (DAG endpoint), Phase 1 (topic-level data).

---

## Phase 4 — Mobile-First Redesign & Color Theme
**Goal:** Replace neon/glassmorphism styling with a restrained, mobile-first theme.

1. Define new design tokens: one accent color per exam track (JEE = indigo/slate, NEET = forest/teal), subjects as *tints* of track accent rather than unrelated hues. Drop `--shadow-neon-md` glow pattern.
2. Rebuild quiz arena mobile-first: single column, bottom-sheet option selection, sticky timer bar, swipe navigation (keep keyboard shortcuts as desktop enhancement).
3. Rebuild roadmap/dashboard pages mobile-first (vertical card scroll on mobile, graph/heatmap toggle on larger screens).
4. Add dark mode as a true second theme (separate token set, not inverted colors).
5. Add PWA manifest + service worker for installability (backend is already offline-first).

**Effort:** 6-10 days. **Depends on:** Phase 3 components.

---

## Phase 5 — Supporting Features
Independent, can be completed in any order once Phases 0-4 are stable.

| Feature | Effort | Notes |
|---|---|---|
| Spaced-repetition "Review Queue" screen | 3-4 days | Surfaces existing Ebbinghaus decay math as an actual daily queue, not just background factor. |
| Error-pattern trend dashboard | 3-4 days | Chart `CONCEPTUAL_ERROR` vs `CALCULATION_ERROR` etc. over time per student. |
| Exportable PDF report card | 3-4 days | Uses existing telemetry + attempt data; one PDF template per exam track. |
| Streaks / light gamification | 2-3 days | Daily streak counter, topic mastery badges — keep visually subtle. |
| Accessibility pass | 2-3 days | Tap target sizing, font scaling, dyslexia-friendly font toggle. |

---

## Suggested Order & Timeline

```
Week 1        Phase 0 (groundwork)
Week 2        Phase 1 (tiered diagnostics)
Week 2-3      Phase 2 (chatbot hardening) — parallel track, independent data needs
Week 3-4      Phase 3 (visual roadmap)
Week 4-6      Phase 4 (mobile-first redesign + theme)
Week 6+       Phase 5 (pick 2-3 features based on priority)
```
