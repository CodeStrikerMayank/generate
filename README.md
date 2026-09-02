# Adaptive Student Intelligence & Dynamic Roadmap Platform (v3.0)

An offline-first, mathematically-grounded **Adaptive Student Assessment, AI Skill Extraction, and Dynamic Roadmap Engine** engineered specifically for **JEE Main (PCM)**, **NEET-UG (PCB)**, and **UPSC**.

> 📖 **Comprehensive System Manual**: See [SYSTEM_MANUAL_AND_ARCHITECTURE.md](SYSTEM_MANUAL_AND_ARCHITECTURE.md) for exhaustive mathematical derivations, algorithms, database schemas, and complete REST API specifications.  
> 🗺️ **Platform Roadmap & Execution Status**: See [UPGRADE_V3_ROADMAP.md](UPGRADE_V3_ROADMAP.md) for the phased engineering record from Phase 0 to Phase 5.

---

## 🌟 Platform v3.0 Core Capabilities

### 1. Compulsory Diagnostic Gateway (First Interface)
Upon first opening the platform, a compulsory modal enforces candidate onboarding:
* 🔭 **JEE Main Track (PCM)**: Physics, Chemistry, Mathematics (Mechanics, Calculus, Ionic Equilibrium, GOC).
* 🧬 **NEET-UG Track (PCB)**: Biology, Physics, Chemistry (NCERT Cell Biology, Genetics, Cardiac Physiology, Ray Optics).

### 2. Tiered Diagnostic Testing Pipeline
* **Tier 1 — Screener (9 Questions)**: Balanced 3-subject baseline test (3 Physics + 3 Chemistry + 3 Math for JEE; 3 Biology + 3 Physics + 3 Chemistry for NEET). Automatically detects weak subjects ($< 60\%$ accuracy).
* **Tier 2 — Targeted Topic Drills (`POST /api/assessments/start-drill`)**: 5-Question focused PYQ drills targeting isolated chapters and prerequisite gaps in weak subjects.
* **Tier 3 — Full Syllabus Deep Scan (`POST /api/assessments/start-full-scan`)**: 15-Question comprehensive diagnostic spanning all curriculum chapters to calibrate global Latent Ability ($\theta$).

### 3. Authentic PYQ Questions with Altered Parameters
Questions are adapted directly from official NTA Past Year Questions (2021–2023) with **modified numerical data and contextual variables**:
* Rote memorization fails; candidates must calculate from first principles.
* Step-by-step mathematical and conceptual derivations are pre-computed inside the engine.
* Distractor analysis maps choices to explicit error classifications (`CONCEPTUAL_ERROR`, `CALCULATION_ERROR`, `FORMULA_SELECTION_ERROR`, `SIGN_ERROR`, `SPEED_ERROR`).

### 4. Interactive Multi-Mode Visual Roadmap
The roadmap tab features a segmented 3-mode view switcher:
1. **🗺️ Step Sequence**: Chronological action timeline with priority badges, time estimates, and prerequisite rationale.
2. **🕸️ Visual DAG Graph**: Native interactive SVG Directed Acyclic Graph with zoom/pan controls, directional prerequisite arrows, and color-coded status pills (🟢 Mastered $\ge 70\%$, 🟡 Developing $40-69\%$, 🔴 Weak $< 40\%$).
3. **📊 Chapter Heatmap Grid**: Mobile-optimized chapter matrix showing average mastery %, concept counts, broken prerequisite alerts, and 1-click chapter drill triggers.

### 5. Hardened Deterministic Offline Chatbot
Powered by an offline `IntentClassifier` and slot-filling `templates.py`:
* **Zero Hallucinations**: Responses are built directly from the student's quiz attempt items, distractor notes, and active roadmap actions.
* **Two-Stage Intent Matching**: Regex/Keyword matching + Levenshtein token distance fallback for typos.
* **Supported Intents**: `ANALYZE_MISTAKES`, `EXPLAIN_ROADMAP`, `STRATEGY_TIPS`, `EXPLAIN_CONCEPT`, `UNKNOWN`.
* **Safe Input Sanitization**: Prompt injection delimiters stripped, queries bounded to 500 characters, with quick prompt suggestion chips.
* **Optional Ollama Polish**: Can optionally pass deterministic text to a local Ollama model for stylistic polish without altering technical facts.

### 6. Mobile-First Redesign & Exam Themes
* **Dynamic Exam Theming**:
  - **JEE Main**: Deep slate & indigo palette (`#070a13`, `#0f172a`, `#6366f1`, `#38bdf8`).
  - **NEET-UG**: Deep dark forest & teal palette (`#040e0c`, `#0b241f`, `#10b981`, `#14b8a6`).
* **Mobile Quiz Arena**: Single-column responsive layout, sticky timer & progress header, full-width touch-friendly options ($\ge 48\text{px}$ touch targets), and bottom action buttons.

### 7. Supporting Intelligence Features
* **Spaced-Repetition Review Queue (`GET /api/supporting/review-queue/{id}`)**: Schedules concept reviews using the Ebbinghaus memory retention curve ($R(t) = e^{-t/S} < 0.65$).
* **Cognitive Error Trends (`GET /api/supporting/error-trends/{id}`)**: Visual analytics of error patterns over time (calculation slips vs conceptual gaps) and subject tendencies.
* **Printable Academic Report Card (`GET /api/supporting/report-card/{id}`)**: Official audit scorecard with print-optimized (`@media print`) CSS for clean PDF export.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                              1. KNOWLEDGE MODEL                                   |
|  Curriculum Hierarchy (Exam -> Subject -> Chapter -> Topic -> Concept)            |
|  Prerequisite DAG (NetworkX Graph with strength & topological dependency sort)    |
|  PYQ Question Bank with Modified Data & Verified Step-by-Step Derivations          |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                              2. STUDENT MODEL                                     |
|  Mastery Engine (Multi-Factor Baseline + Bayesian Knowledge Tracing + IRT 2PL)    |
|  Ebbinghaus Memory Retention Engine (Exponential decay R(t) = exp(-t/S))          |
|  Calibrated Uncertainty & Confidence Estimator                                    |
|  Cognitive Error Classifier (Conceptual Gaps, Calculation Slips, Distractor Traps)|
|  Append-Only Interaction Telemetry Stream                                         |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            3. PEDAGOGICAL ENGINE                                  |
|  Tiered Diagnostic Selector (Screener -> Weak-Subject Drill -> Full Scan)         |
|  Dynamic DAG Priority Engine (Prerequisites -> Yield -> Mastery Gap -> Forgetting)|
|  Multi-Mode Roadmap Visualizer (Step Sequence | Visual DAG Graph | Chapter Heatmap)|
|  Hardened Offline AI Study Mentor (Deterministic Intent Engine + Template Filling)|
|  Spaced Repetition Review Queue & Error Trend Analytics                           |
+-----------------------------------------------------------------------------------+
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register student profile & target exam |
| `GET` | `/api/auth/profile/{id}` | Get student profile & current mastery metrics |
| `GET` | `/api/curriculum/graph/{exam_id}` | Export full curriculum DAG nodes & edges with mastery states |
| `POST` | `/api/assessments/start` | Launch Tier 1 diagnostic screener (9 Qs) |
| `POST` | `/api/assessments/start-drill` | Launch Tier 2 topic drill targeting weak chapters (5 Qs) |
| `POST` | `/api/assessments/start-full-scan` | Launch Tier 3 full syllabus deep scan (15 Qs) |
| `POST` | `/api/assessments/submit` | Grade assessment, update BKT/IRT mastery, recalculate roadmap |
| `GET` | `/api/roadmap/active/{id}` | Fetch active dynamic roadmap actions |
| `GET` | `/api/roadmap/next-action/{id}` | Fetch Next Best Action (NBA) milestone |
| `POST` | `/api/roadmap/regenerate/{id}` | Force dynamic roadmap recalculation |
| `POST` | `/api/ai/chat/{id}` | Query AI mentor (mistakes, roadmap, strategy, concepts) |
| `GET` | `/api/supporting/review-queue/{id}` | Query concepts due for spaced-repetition review |
| `GET` | `/api/supporting/error-trends/{id}` | Aggregated cognitive error patterns & subject biases |
| `GET` | `/api/supporting/report-card/{id}` | Generate printable performance scorecard data |
| `GET` | `/api/telemetry/stream/{id}` | Real-time append-only telemetry event log |

---

## 🛠️ Local Setup, Testing, and Execution

### 1. Requirements
* Python 3.10+ (Fully compatible with Python 3.14 on Windows)
* Dependencies:
  ```bash
  pip install fastapi uvicorn sqlalchemy networkx numpy scipy pydantic pytest httpx
  ```

### 2. Run Automated Test Suite
```bash
python -m pytest -v
```
*Validates all 15 automated test suites (IRT, BKT, DAG Prerequisites, Priority Engine, Roadmap Regeneration, Chatbot Intent Classifier, and Supporting Features).*

### 3. Start the Server
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 4. Access the Web Application
* **Frontend Arena**: Open `http://127.0.0.1:8000/` in any browser.
* **Interactive OpenAPI Swagger**: `http://127.0.0.1:8000/docs`
* **Alternative ReDoc**: `http://127.0.0.1:8000/redoc`
