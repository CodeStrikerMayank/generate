# Comprehensive System Architecture, Algorithmic Engine & Interface Blueprint

> **File:** `assignment.md` (Unified Master Specification)  
> **Target Examinations:** JEE Main / Advanced (PCM), NEET-UG (PCB), UPSC Civil Services (Prelims & Mains)  
> **Architectural Standard:** Offline-First, Psychometrically Grounded, Low-Latency Pedagogical Engine  
> **Document Purpose:** Single consolidated blueprint covering all legacy foundations, modernized HuggingFace API integrations, psychometric algorithms, clean UI/UX specifications, and the Daily 3-Subject Interleaved Assignment Subsystem.

---

## 1. System Vision & Core Mission

Modern competitive exam preparation is severely hampered by static PDF problem sets, uniform homework sheets, and linear syllabi. When a candidate attempts 50 problems from the same chapter consecutively (blocked practice), they experience a temporary "illusion of competence." Within 72 hours, exponential memory decay erases up to 60% of the learned material because the brain was not forced to retrieve knowledge across distinct cognitive domains.

The **Adaptive Intelligence Engine (AIE)** replaces static curriculum delivery with a dynamic, mathematically calibrated cognitive ecosystem. It treats a student's mind as a probabilistic state vector navigating a Directed Acyclic Graph (DAG) of prerequisite concepts. 

The system operates across three competitive examination tracks:
1. **JEE Main & Advanced (PCM)**: Physics, Chemistry, and Mathematics with rigorous numerical calculus, coordinate geometry, classical mechanics, and molecular thermodynamics.
2. **NEET-UG (PCB)**: Biology (Botany & Zoology), Physics, and Chemistry structured around NCERT core competencies, cellular genetics, human physiology, and chemical equilibrium.
3. **UPSC Civil Services (CSE)**: General Studies (Papers I–IV), CSAT analytical reasoning, and descriptive Mains answer writing evaluated across constitutional, economic, and ethical dimensions.

---

## 2. Legacy Foundation vs. Modernized Addon Framework

```
+--------------------------------------------------------------------------------------------------+
|                                    PLATFORM EVOLUTION MATRIX                                     |
+------------------------------------+-------------------------------------------------------------+
| Feature Area                       | Modernized Addon Architecture (Current v4.4)                |
+------------------------------------+-------------------------------------------------------------+
| Examination Scope                  | Tri-Stream: JEE (PCM), NEET (PCB), and UPSC Civil Services  |
| Question Repository                | 405,000+ Items: Live HuggingFace 169Pi/exambench + Reja1     |
| Question Generation                | Algorithmic MCQ Synthesis with Cognitively Modeled Options  |
| Daily Student Practice             | Interleaved 3-Subject Assignment Engine (60-75 Qs/day)      |
| Descriptive Writing Evaluation     | AI Multi-Dimensional Rubric (5 Dimensions for UPSC Mains)   |
| Knowledge Topology                 | Dynamic Prerequisite DAG with Canvas Force Animation        |
| Identity & Access Control          | 3-Role Portal (Student, Guest, Admin) with Sci-Fi HUD Buffer|
| Psychometric Modeling              | Hybrid: Multi-Factor Mastery + BKT + 2PL IRT + Ebbinghaus   |
| Diagnostic Testing Arena           | 3-Tier Testing: 9-Q Screener, 5-Q Topic Drill, Full Scan    |
+------------------------------------+-------------------------------------------------------------+
```

---

## 3. Core Cognitive, Mathematical & Psychometric Algorithms

The engine avoids generic heuristics, relying instead on established cognitive and psychometric models.

### 3.1 Multi-Factor Concept Mastery Algorithm
A student's mastery score for any concept $c$ at time $t$ is bounded within $[0.0, 1.0]$ and formulated as a multi-component composite:

$$M(c, t) = w_{\text{rec}} \cdot A_{\text{rec}}(c) + w_{\text{bkt}} \cdot P(L_{c,t}) + w_{\text{cov}} \cdot C_{\text{cov}}(c) + w_{\text{decay}} \cdot R(c, t)$$

#### Parameter Specifications
- **Recent Accuracy ($A_{\text{rec}}$)**: Exponentially smoothed performance over the most recent 5 attempts. Each attempt $i$ carries weight $\lambda^i$ ($\lambda = 0.85$), ensuring recent work supersedes older mistakes.
- **BKT Latent Knowledge ($P(L_{c,t})$)**: Current Bayesian probability that the student has transitioned into a "Learned" state.
- **Curriculum Coverage ($C_{\text{cov}}$)**: Ratio of unique solved question archetypes against total available concept exemplars.
- **Memory Retention ($R(c, t)$)**: Decay probability derived from the Ebbinghaus forgetting equation.
- **Calibrated Weight Vector**:
  - $w_{\text{rec}} = 0.35$ (Demonstrated recent performance)
  - $w_{\text{bkt}} = 0.30$ (Statistically inferred latent state)
  - $w_{\text{cov}} = 0.15$ (Breadth of problem exposure)
  - $w_{\text{decay}} = 0.20$ (Time-attenuated retention penalty)

---

### 3.2 Ebbinghaus Memory Decay & Spaced Repetition Algorithm
Memory retention decays exponentially as a function of elapsed time since the last retrieval event:

$$R(t) = \exp\left(-\frac{t}{S}\right)$$

Where:
- $t$: Elapsed time in days since last active practice on concept $c$.
- $S$: **Memory Stability Factor** (the half-life of knowledge in days).

#### Memory Stability Recalibration Logic
Whenever a student practices concept $c$, stability is adjusted:
1. **Successful Retrieval ($Y = 1$)**:
   $$S_{\text{next}} = S_{\text{prior}} \cdot \left(1 + 1.618 \cdot M(c) \cdot (1 - 0.40)^{\text{failed\_reviews}}\right)$$
   The golden ratio factor ($1.618$) progressively widens review intervals for stable concepts.
2. **Failed Retrieval ($Y = 0$)**:
   $$S_{\text{next}} = \max\left(1.0, S_{\text{prior}} \cdot 0.50\right)$$
   Stability is halved, immediately scheduling the concept for near-term remediation.
3. **Trigger Threshold**: When $R(t) < 0.60$, the concept is automatically pushed into the student's Spaced Repetition Review Queue.

---

### 3.3 Bayesian Knowledge Tracing (BKT) Algorithm
BKT models learning as a Hidden Markov Model where the student is either in an *Unlearned* ($L_0$) or *Learned* ($L_1$) state.

#### Model Parameters
- $P(L_0)$: Prior probability of knowing the concept before practice ($0.15$ for novices, $0.40$ for diagnostic passers).
- $P(T)$: Probability of transitioning from unlearned to learned state at each practice opportunity ($T = 0.18$).
- $P(G)$: Guess probability ($G = 0.20$ for 4-choice items with plausible distractors).
- $P(S)$: Slip probability ($S = 0.08$; student knows the concept but makes a careless error).

#### Algorithmic Execution Steps
1. **Receive Observation**: Student submits answer $Y_t \in \{0, 1\}$.
2. **Compute Posterior Conditioned on Observation**:
   - If Correct ($Y_t = 1$):
     $$P(L_t | Y_t = 1) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$
   - If Incorrect ($Y_t = 0$):
     $$P(L_t | Y_t = 0) = \frac{P(L_{t-1}) \cdot P(S)}{P(L_{t-1}) \cdot P(S) + (1 - P(L_{t-1})) \cdot (1 - P(G))}$$
3. **Apply Knowledge Transition for the Next Step**:
   $$P(L_{t+1}) = P(L_t | Y_t) + \left(1 - P(L_t | Y_t)\right) \cdot P(T)$$

---

### 3.4 2-Parameter Logistic Item Response Theory (IRT 2PL)
Item Response Theory links a student's unobservable latent ability $\theta \in [-3.0, +3.0]$ to the probability of solving a question of specific difficulty:

$$P(Y_i = 1 | \theta, a_i, b_i) = \frac{1}{1 + \exp\left(-1.702 \cdot a_i (\theta - b_i)\right)}$$

Where:
- $b_i \in [-2.5, +2.5]$: Item difficulty parameter.
- $a_i \in [0.5, 2.5]$: Item discrimination parameter (gradient of response curve).
- $\theta$: Student's latent ability.

#### Latent Ability Estimation Algorithm
Following an assessment session of $N$ items with responses $Y = (y_1, y_2, \dots, y_N)$:
1. Define the log-likelihood function:
   $$\ln L(\theta | Y) = \sum_{i=1}^N \left[ y_i \ln P_i(\theta) + (1 - y_i) \ln (1 - P_i(\theta)) \right]$$
2. Update ability estimate $\hat{\theta}$ via iterative Newton-Raphson root finding:
   $$\theta^{(k+1)} = \theta^{(k)} - \frac{\frac{\partial \ln L}{\partial \theta}}{\frac{\partial^2 \ln L}{\partial \theta^2}}$$
3. Convergence is reached when $|\theta^{(k+1)} - \theta^{(k)}| < 0.01$ or upon reaching 20 iterations.

---

### 3.5 NetworkX Prerequisite DAG & Topological Curriculum Engine
The knowledge space is modeled as an edge-weighted directed acyclic graph $G = (V, E)$:
- **Vertices ($V$)**: Individual concepts with difficulty weights and syllabus yield ratings.
- **Edges ($E$)**: Dependency constraints $(u \to v)$ indicating concept $u$ must be mastered before concept $v$.

#### Topological Sequencing & Unlock Algorithm
1. **Check Node Unlock Status**: Concept $v$ unlocks if and only if every direct parent $u \in \text{Parents}(v)$ satisfies $M(u) \ge 0.70$.
2. **Prioritization Scoring**: For all unlocked concepts, assign a priority score:
   $$\text{Priority}(v) = 0.40 \cdot (1.0 - M(v)) + 0.35 \cdot \text{ExamRelevance}(v) + 0.25 \cdot \text{OutDegree}(v)$$
   Where $\text{OutDegree}(v)$ reflects how many downstream advanced topics depend on concept $v$.
3. **Next Best Action (NBA)**: The highest-priority unlocked concept with mastery $< 0.70$ becomes the student's next mandatory milestone.

---

### 3.6 Cognitive Error Classification Algorithm
When an incorrect answer is submitted, the engine identifies the root cognitive failure mode rather than simply marking it wrong:

```
                  [Incorrect Response Submitted]
                                │
             Time Taken < 0.35 * Estimated Time?
                     ┌──────────┴──────────┐
               (Yes) │                     │ (No)
                     ▼                     ▼
              [SPEED_ERROR /       Does Distractor Match
              IMPULSIVE_SLIP]      Misconception Map?
                                   ┌───────┴───────┐
                             (Yes) │               │ (No)
                                   ▼               ▼
                           [CONCEPTUAL_ERROR /   Formula Inverted or
                            MISCONCEPTION]       Sign Flipped?
                                                 ┌───┴───┐
                                           (Yes) │       │ (No)
                                                 ▼       ▼
                                         [CALCULATION_  [FORMULA_SELECTION_
                                          ERROR]         ERROR / UNCLASSIFIED]
```

---

## 4. External Data Ingestion & Live Streaming Pipelines

```
                             [HuggingFace API Infrastructure]
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
         [169Pi/exambench API]                           [Reja1 Benchmark API]
         (405,906 Question Records)                      (Official 2024-25 Exam Crops)
                    │                                               │
                    ▼                                               ▼
      [ExamBenchService Pipeline]                     [BenchmarkService Pipeline]
      1. Keyword Stream Classifier                    1. High-Res Image Extractor
      2. Solution Derivation Splitter                 2. Official Key Normalizer
      3. Distractor Synthesizer                       3. Metadata Formatter
                    │                                               │
                    └───────────────────────┬───────────────────────┘
                                            ▼
                             [3-Tier Caching Hierarchy]
                             Tier 1: Fast Memory Pool
                             Tier 2: Local JSON Disk Store
                             Tier 3: Relational SQLite DB
                                            │
                                            ▼
                           [Daily 3-Subject Assignment Engine]
```

### 4.1 HuggingFace `169Pi/exambench` Processing Engine
- **Data Source**: Live dataset server hosting 405k items covering higher secondary and professional engineering/medical entrance questions.
- **Raw Data Components**: Each entry contains `prompt` (problem statement), `response` (solution text), and `complex_cot` (step-by-step mathematical reasoning).
- **Classification Engine**:
  - Scans prompt tokens against a curated taxonomy of over 120 competitive examination terms.
  - Automatically identifies target stream: JEE (Mathematics, Physics, Chemistry), NEET (Biology, Physics, Chemistry), or UPSC (General Studies, Governance, Science).

### 4.2 HuggingFace `Reja1/jee-neet-benchmark` Official Crop Engine
- **Data Source**: Authentic scanned question crops from official 2024 and 2025 JEE Advanced and NEET-UG examinations.
- **Image URL Binding**: Preserves exact high-resolution cropped diagrams, circuit boards, molecular models, and anatomical structures directly in `Question.image_url`.
- **Answer Key Standardizer**: Converts diverse key notations (`"Option 2"`, `["B"]`, `"2"`, `B`) into canonical single-letter options (`A`, `B`, `C`, `D`).

### 4.3 3-Tier Resilience & Zero-Latency Cache Architecture
1. **Tier 1 (In-Memory Hot Pool)**: Active daily assignment questions stay pre-parsed in memory.
2. **Tier 2 (Disk File Cache)**: Local JSON stores (`exambench_cache.json` and `jee_neet_benchmark_cache.json`). If the external network call exceeds 15 seconds or fails, the engine seamlessly draws from the disk cache with zero user disruption.
3. **Tier 3 (Persistent Database)**: Seeded relational SQLite database with indexed lookups on `exam`, `subject`, `chapter`, and `difficulty`.

---

## 5. Daily 3-Subject Assignment Engine: Master Blueprint

### 5.1 Cognitive Architecture: Interleaved vs. Blocked Practice
Educational research demonstrates that **blocked practice** (e.g., spending an entire day only on Organic Chemistry) leads to shallow pattern recognition and rapid forgetting. 

The **Daily Assignment Engine** enforces **interleaved practice** by assembling balanced problem sets across all three canonical subjects every single day:
- **JEE Main**: Physics (20–25 Qs) + Chemistry (20–25 Qs) + Mathematics (20–25 Qs) $\to$ **60–75 Qs/day**.
- **NEET-UG**: Biology (20–25 Qs) + Physics (20–25 Qs) + Chemistry (20–25 Qs) $\to$ **60–75 Qs/day**.
- **UPSC CSE**: General Studies (20–25 Qs) + Science & Tech (20–25 Qs) + CSAT Logic/Math (20–25 Qs) $\to$ **60–75 Qs/day**.

---

### 5.2 Algorithmic Assignment Generation Flow
When `/assignments/today/{student_id}` is called:

```
[Student Requests Today's Assignment]
                 │
  Assignment Already Exists for Today?
        ┌────────┴────────┐
  (Yes) │                 │ (No)
        ▼                 ▼
[Return Active State]   [Retrieve Student's Target Exam & Latent Ability θ]
                          │
                        [Determine Canonical 3 Subjects for Exam]
                          │
                        [Loop Across Each of the 3 Subjects]
                          │
                          ├─ 1. Identify Concepts with Mastery < 0.70 or Decayed R(t) < 0.60
                          ├─ 2. Query Local DB for Matching Questions
                          ├─ 3. Filter Items Matching Zone of Proximal Development: |b_i - θ| ≤ 0.60
                          ├─ 4. If Item Pool < 20, Synthesize New Items via ExamBench Cache
                          └─ 5. Add 20-25 Questions to Subject Block
                          │
                        [Interleave and Sequence Questions 1 to N]
                          │
                        [Persist DailyAssignment & DailyAssignmentItem Records]
                          │
                        [Emit Telemetry Event 'ASSIGNMENT_GENERATED']
                          │
                        [Return Complete Daily Assignment Payload to Client]
```

---

### 5.3 Distractor Synthesis Algorithm
When synthesizing multiple-choice questions from raw derivations:
1. **Extract Core Statement**: Isolate the final conclusion or derived value from the step-by-step reasoning.
2. **Assign Random Correct Key**: Place the true answer in a deterministically selected letter ($A, B, C,$ or $D$) using a seed based on the question prompt.
3. **Generate 3 Pedagogical Distractors**:
   - *Distractor 1 (Calculation Slip)*: Invert boundary scale factor ($k \to 1/k$) or invert arithmetic operation.
   - *Distractor 2 (Conceptual Error)*: Disregard active boundary condition (e.g., assume temperature remains constant).
   - *Distractor 3 (Formula Selection Error)*: Apply static linear approximation to dynamic nonlinear system.
4. **Attach Explanations**: Provide comprehensive step derivations and specific error warnings for every wrong option.

---

### 5.4 Progressive Hint Reveal Logic
To prevent students from stalling on challenging problems without handing them full solutions:
- **Hint Level 1 (Governing Concept)**: Outlines the physical law, chemical principle, or theorem to apply. *Score penalty: $-5\%$.*
- **Hint Level 2 (Formula Clue)**: Displays the algebraic formula structure without variables filled in. *Score penalty: $-15\%$.*
- **Hint Level 3 (First Step Substitution)**: Shows boundary variable substitution into the equation. *Score penalty: $-30\%$.*
- All hints used are recorded in telemetry, and final mastery updates factor in the penalized accuracy.

---

### 5.5 Auto-Save & Submission State Machine
- **Continuous Background Auto-Save**: Responses and review flags sync every 30 seconds or upon tab switching via `/save-progress`.
- **Final Submission (`/submit`)**:
  1. Computes raw accuracy and subject-by-subject percentage breakdowns.
  2. Runs Error Classifier on every wrong answer, inserting records into `StudentErrorLog`.
  3. Updates BKT probabilities and recalculates concept mastery scores.
  4. Pushes degraded concepts into the Spaced Repetition Review Queue.
  5. Computes consecutive daily practice streak.
  6. Locks the assignment and reveals complete step derivations and distractor analyses.

---

## 6. UPSC Civil Services Dual-Tier Subsystem

The UPSC track accommodates both multiple-choice and written descriptive formats.

### 6.1 Prelims Testing Arena
- Real-time simulation of UPSC Prelims General Studies Paper I and CSAT Paper II.
- Standard negative marking applied: $+2.0$ marks for correct answers, $-0.66$ marks deducted for incorrect selections.
- Detailed rationales emphasize answer elimination strategies and qualifiers.

### 6.2 Mains Descriptive Workspace & 5-Dimensional AI Rubric
Descriptive answer evaluation measures five core competencies:

```
+─────────────────────────────────────────────+────────────+──────────────────────────────────────────+
| Evaluation Dimension                        | Max Points | Assessment Criteria                      |
+─────────────────────────────────────────────+────────────+──────────────────────────────────────────+
| 1. Understanding & Directive Relevance      |    3.0     | Addresses command words (Discuss, etc.)  |
| 2. Structure & Organization                 |    2.0     | Crisp Intro, clear headings, Conclusion  |
| 3. Content Depth & Empirical Evidence       |    2.5     | Constitutional articles, data, judgments |
| 4. Policy & Constitutional Alignment        |    1.5     | Constitutional morality, public interest |
| 5. Critical Balance & Multiperspectivity    |    1.0     | Balanced synthesis of trade-offs         |
+─────────────────────────────────────────────+────────────+──────────────────────────────────────────+
| TOTAL SCORE                                 |   10.0     | Scaled to 10 or 15 marks per prompt      |
+─────────────────────────────────────────────+────────────+──────────────────────────────────────────+
```

---

## 7. Clean, Minimalist UI & Interaction Design (Student Perspective)

The user experience follows cognitive ergonomics: low distraction, clear visual hierarchy, and instant responsiveness.

### 7.1 Interface Layout Wireframe

```
+--------------------------------------------------------------------------------------------------+
|  [LOGO] ADAPTIVE INTELLIGENCE ENGINE        [EXAM: NEET-UG]  [STREAK: 7 DAYS]  [PROFILE: JOHN]   |
+--------------------------------------------------------------------------------------------------+
|  [DASHBOARD]  [DAILY ASSIGNMENT (ACTIVE)]  [TESTING ARENA]  [ROADMAP DAG]  [REVIEW QUEUE]  [AI]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  DAILY 3-SUBJECT ASSIGNMENT -- 2026-09-04                                    [TIMER: 01:14:22]   |
|                                                                                                  |
|  +---------------------------+  +---------------------------+  +-------------------------------+ |
|  | [x] BIOLOGY (20/20)       |  | [*] PHYSICS (12/20)       |  | [ ] CHEMISTRY (0/20)          | |
|  |     Accuracy: 85%         |  |     In Progress           |  |     Pending                   | |
|  +---------------------------+  +---------------------------+  +-------------------------------+ |
|                                                                                                  |
|  QUESTION 32 OF 60 -- PHYSICS: Mechanics & Rotational Dynamics                                  |
|  Difficulty: Standard (b=0.55) | Estimated Time: 75s | [?] Request Progressive Hint              |
|                                                                                                  |
|  A uniform disc of mass M and radius R rotates about its central axis with angular velocity w... |
|  If a sudden frictional impulse is applied to the outer rim, what is the new angular momentum?   |
|                                                                                                  |
|  (A) (1/2) M R^2 w                                                                               |
|  (B) (1/4) M R^2 w                                                                               |
|  (C) (3/4) M R^2 w                                                                               |
|  (D) M R^2 w                                                                                     |
|                                                                                                  |
|  [ PREVIOUS ]            [ FLAG FOR REVIEW ]            [ SAVE & NEXT ]           [ SUBMIT ALL ] |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|  QUESTION PALETTE:                                                                               |
|  [01] [02] [03] ... [19] [20] | [21] [22]* [23] ... [39] [40] | [41] [42] ... [59] [60]          |
|  Green = Answered | Orange* = Marked for Review | Grey = Unvisited | Blue = Current              |
+--------------------------------------------------------------------------------------------------+
```

### 7.2 UI Design Principles & Ergonomics
1. **Zero Cognitive Friction**:
   - Primary actions (Save & Next, Flag, Hint) use distinct visual hierarchies.
   - The question text uses generous line height ($1.65$) and clear typography to minimize eye strain during long practice sessions.
2. **Keyboard-Driven Efficiency**:
   - `1, 2, 3, 4` or `A, B, C, D`: Select corresponding option.
   - `Enter` or `N`: Save answer and advance to next question.
   - `R`: Toggle review marker.
   - `P`: Return to previous question.
3. **Dynamic Exam Themes**:
   - **JEE Main**: Dark Indigo & Electric Blue (`#070a13`, `#6366f1`, `#38bdf8`).
   - **NEET-UG**: Deep Forest Slate & Emerald Teal (`#040e0c`, `#10b981`, `#14b8a6`).
   - **UPSC CSE**: Obsidian & Warm Academic Amber (`#0a0a0c`, `#f59e0b`, `#d97706`).
4. **Non-Intrusive Feedback**:
   - Autosaves show subtle checkmarks rather than disruptive alert banners.
   - Warning dialogs only appear on irreversible actions, such as submitting with unanswered items.

---

## 8. Performance, Smoothness & Zero-Lag Optimizations

1. **Optimistic UI Updates**:
   When a student selects an option and clicks *Next*, the UI immediately transitions to the next item in memory while dispatching an asynchronous save in the background. The student never waits on network latency.
2. **Tab Preservation & No Full-Page Reloads**:
   Switching between Dashboard, Daily Assignment, Concept Map, and Review Queue toggles active DOM containers via CSS classes. DOM elements and user inputs are retained without losing scroll position or text state.
3. **Canvas Animation Performance**:
   The Knowledge Graph canvas decouples physics calculations from rendering:
   - Node positions are computed via a lightweight force-directed layout.
   - Rendering pauses automatically when the graph tab is hidden, keeping CPU usage below 1%.
4. **Background Pre-Fetching**:
   When question 15 of a subject is reached, the client pre-fetches and validates image assets for the upcoming subject block.

---

## 9. Security, Data Integrity & Foreign Key Guardianship

1. **Foreign Key Auto-Provisioning Guardian**:
   When a student creates or submits an assessment session, the backend checks for the student record in SQLite. If missing, it auto-provisions a baseline student record before writing attempt items, preventing database `IntegrityError` failures.
2. **Role-Based Access Control (RBAC)**:
   - **Guest**: Can explore the concept hierarchy and take open screener quizzes; tracking is held in session storage.
   - **Student**: Full persistence of mastery scores, assignments, streaks, and telemetry.
   - **Admin**: Access restricted via dual-key validation (`1234admin` or `aie_internal_2024`) for database resets, question seeding, and raw telemetry inspection.
3. **Defensive Input Sanitization**:
   All user inputs in UPSC written prompts and search bars are validated against prompt injection patterns and capped at safe character lengths before evaluation.

---

## 10. Verification & Operational Health Checklist

Before certifying the engine for daily practice, ensure each subsystem passes this checklist:

```
[ ] 1. Health Endpoint (/api/v1/health) returns 200 with supported exams ["JEE", "NEET", "UPSC"].
[ ] 2. Exam calibration correctly updates navigation tabs:
       - JEE displays Physics, Chemistry, Mathematics roadmaps.
       - NEET displays Biology, Physics, Chemistry roadmaps.
       - UPSC displays Prelims Arena, Mains Workspace, and General Studies.
[ ] 3. Daily Assignment generation:
       - Assembles 3 distinct subject blocks with 20-25 questions each.
       - Correctly calculates and updates student streak count.
       - Auto-save persists answers without terminating the attempt.
[ ] 4. Diagnostic Testing Arena:
       - 9-Q Screener, 5-Q Topic Drill, and 15-Q Full Scan run without errors.
       - Submissions display the Result Feedback Modal and unlock roadmaps.
[ ] 5. Knowledge Graph:
       - HTML5 Canvas renders nodes with color-coded mastery states.
       - Interactive clicks display concept details and prerequisite chains.
[ ] 6. UPSC Civil Services Subsystem:
       - Prelims quiz applies +2.0 / -0.66 scoring.
       - Mains answer workspace validates word count and returns 5-dimensional rubric feedback.
[ ] 7. Automated Test Suite:
       - All 24 unit test suites pass successfully via `pytest`.
```

---

*This document serves as the master specification for the Adaptive Intelligence Engine.*
