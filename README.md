# Adaptive Student Intelligence & Dynamic Roadmap Platform

An offline-first, mathematically-grounded **Adaptive Student Assessment, AI Skill Extraction, and Personalized Roadmap Engine** engineered specifically for **JEE Main (PCM)**, **NEET-UG (PCB)**, and **UPSC**.

> 📖 **Comprehensive Documentation**: See [SYSTEM_MANUAL_AND_ARCHITECTURE.md](SYSTEM_MANUAL_AND_ARCHITECTURE.md) for the exhaustive system manual, algorithms, equations, database schema, and complete API specification.

---

## 🌟 Key Platform Capabilities

### 1. Compulsory Diagnostic Gateway (First Interface)
When a student opens the website, a compulsory gateway modal prompts them to choose their exam track:
* 🔭 **JEE Main (PCM)**: Physics, Chemistry, Mathematics (Mechanics, Calculus, Equilibrium, GOC).
* 🧬 **NEET-UG (PCB)**: Biology, Physics, Chemistry (NCERT Cell Biology, Genetics, Physiology, Optics).

### 2. Authentic PYQ Questions with Modified Data
Questions are adapted from recent **official NTA Past Year Questions (2021–2023)**, with modified numerical parameters and constants:
* Rote memorization fails; students must calculate from first principles.
* Every question contains pre-calculated step-by-step mathematical and conceptual derivations ("*the answer is inside the brain*").
* Distractor analysis maps wrong answers into `CONCEPTUAL_ERROR`, `CALCULATION_ERROR`, `FORMULA_SELECTION_ERROR`, or `SIGN_ERROR`.

### 3. Deep Topic Balanced Diagnostic Quiz
* **9 Balanced Questions**: 3 questions per subject across all 3 subjects (JEE: 3 Physics + 3 Chemistry + 3 Math; NEET: 3 Biology + 3 Physics + 3 Chemistry).
* Assessment Arena with real-time countdown timer, subject badges, PYQ tags, animated progress bar, and keyboard shortcuts (`1-4`, `A-D`, arrows).

### 4. AI Cognitive Skill Extraction
Submitting the test extracts:
* **Latent Ability ($\theta$)**: Calibrated via Item Response Theory (IRT 2PL).
* **Bayesian Knowledge State $P(L)$**: Probabilistic concept mastery via BKT.
* **Subject-by-Subject Skill Profile**: Color-coded accuracy meters.
* **Cognitive Error Diagnoses**: Chips identifying specific error patterns.

### 5. Exam-Customized Dynamic Roadmap Engine
The Roadmap Generator and Multi-Factor Priority Engine dynamically adapt based on the selected exam track:
* **JEE Main**: Emphasizes multi-concept synthesis, calculus-mechanics chains, and negative marking defense. Action types: `JEE_FOUNDATION_REBUILD`, `JEE_MAIN_SPRINT`, `JEE_MULTI_CONCEPT_DRILL`, `JEE_ADVANCED_PRACTICE`.
* **NEET-UG**: 50% Biology paper weighting amplification, 45s/question rapid NCERT recall drills, and zero-unforced-error precision. Action types: `NEET_NCERT_CORE_RECALL`, `NEET_HIGH_SPEED_DRILL`, `NEET_APPLICATION_PRACTICE`, `NEET_720_TARGET_SPRINT`.
* **Prerequisite Interception**: Broken foundational prerequisites in the DAG are automatically placed at Step 1 to unblock downstream topics.

### 6. Quiz-Grounded AI Study Mentor
The AI Mentor (`/api/ai/chat/{student_id}`) answers queries directly based on the student's quiz attempt:
* **"Analyze my quiz mistakes"**: Provides an exact post-mortem of missed questions, student's option vs correct option, diagnostic notes, and full derivations.
* **"Explain my roadmap sequence"**: Explains why Step 1 was chosen and what chapters it unlocks.
* **"Give me exam strategy tips"**: Delivers tactical section-by-section time management advice for JEE or NEET.
* Quick-prompt chips in chat for instant one-click interaction.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                              1. KNOWLEDGE MODEL                                   |
|  Curriculum Hierarchy (Exam -> Subject -> Chapter -> Topic -> Concept)            |
|  Prerequisite DAG (NetworkX Graph with strength & directional dependencies)       |
|  PYQ-Adapted Question Bank with Altered Data & Verified Step-by-Step Derivations  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                              2. STUDENT MODEL                                     |
|  Mastery Engine (Multi-factor baseline + BKT Knowledge Tracing + IRT 2PL Ability) |
|  Forgetting & Retention Engine (Ebbinghaus exponential decay + spaced repetition) |
|  Confidence & Uncertainty Estimation (sample-size & variance calibrated)          |
|  Cognitive Error Classification (Conceptual, Calculation, Formula, Sign Slips)    |
|  Append-Only Interaction Telemetry & Audit Stream                                 |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            3. PEDAGOGICAL MODEL                                   |
|  Prerequisite Gap Resolver (NetworkX ancestor tracing for root-cause repair)      |
|  Exam-Customized Priority Engine (JEE Multi-Concept vs NEET 50% Biology Weight)   |
|  Dynamic Roadmap Engine (Action-oriented learning paths, recalibrated per test)   |
|  Quiz-Grounded AI Study Mentor (Local deterministic rules + optional Ollama LLM)  |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ Quick Start & Running Locally

### 1. Requirements
* Python 3.10+
* Fast, lightweight dependencies:
  ```bash
  pip install fastapi uvicorn sqlalchemy networkx numpy scipy pydantic pytest httpx
  ```

### 2. Run Test Suite
```bash
python -m pytest -v
```
*Validates 12 tests across IRT, BKT, DAG Prerequisites, Priority Engine, and Dynamic Roadmap Regeneration.*

### 3. Start the Server
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 4. Open in Browser
Open **http://127.0.0.1:8000/** in your browser.
The **Compulsory Diagnostic Gateway** will welcome you, ready to choose **JEE Main** or **NEET-UG**!
