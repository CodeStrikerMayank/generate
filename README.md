# Adaptive Student Intelligence & Roadmap Engine

An offline-first, production-oriented, mathematically-grounded **Adaptive Student Assessment and Personalized Learning Platform** supporting **JEE** (Main + Advanced), **NEET**, and **UPSC** (Prelims + Mains).

---

## 🌟 Core Philosophy: True Latent Mastery over Marks

The platform does not merely score tests. It continuously answers:
1. **What does this student actually know?** (Latent ability $\theta$ & Bayesian state $P(L)$)
2. **How confident is the system in that estimate?** (Sample-size & consistency variance calibrated confidence)
3. **Which concepts are weak and why?** (Foundational prerequisite gaps, forgetting decay, unstable testing, or speed pressure)
4. **Which missing prerequisite is the root cause?** (NetworkX topological DAG ancestor tracing)
5. **What is the exact Next-Best-Learning-Action?** (Dynamic sequence recalibration after every test attempt)

---

## 🏛️ Tri-Model Architecture

```
+-----------------------------------------------------------------------------------+
|                              1. KNOWLEDGE MODEL                                   |
|  Curriculum Hierarchy (Exam -> Subject -> Chapter -> Topic -> Concept)            |
|  Prerequisite DAG (NetworkX Graph with strength & directional dependencies)       |
|  Question Bank with Multi-dimensional Metadata (Difficulty, Skill, Time, Type)    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                              2. STUDENT MODEL                                     |
|  Mastery Engine (Configurable multi-factor baseline + BKT + IRT estimators)      |
|  Forgetting & Retention Engine (Ebbinghaus exponential decay + spaced repetition) |
|  Confidence & Uncertainty Estimation (sample-size & variance calibrated)          |
|  Error Classification & Speed/Consistency Profiling                               |
|  Append-Only Interaction Telemetry & Event Collection                             |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            3. PEDAGOGICAL MODEL                                   |
|  Weakness Detector (Identifies genuine vs transient gaps, root prerequisite bugs) |
|  Priority Engine (Gap * Exam Weight * Prereq Impact * Forgetting Risk)            |
|  Dynamic Roadmap Engine (Action-oriented learning paths, recalibrated per test)   |
|  Next-Best-Action (NBA) Recommender with human-understandable explainability       |
|  Adaptive Question Selector (Max Information Gain & Difficulty Calibration)       |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Key Modules & Mathematics

### 1. Multi-Factor Baseline Mastery & Confidence
$$\text{Mastery} = w_1 \cdot \text{Accuracy} + w_2 \cdot \text{DifficultyPerf} + w_3 \cdot \text{RecentAccuracy} + w_4 \cdot \text{Retention} + w_5 \cdot \text{Consistency} + w_6 \cdot \text{SpeedFactor}$$
$$\text{Confidence} = 0.85 \cdot (1 - e^{-N / 5.0}) + 0.15 \cdot (1 - \sigma^2)$$

### 2. Bayesian Knowledge Tracing (BKT)
Tracks latent knowledge state transitions $P(L)$ across sequential attempt observations with parameters $P(L_0), P(T), P(G), P(S)$.

### 3. Item Response Theory (IRT 2PL / 3PL)
$$P(\theta) = c + \frac{1 - c}{1 + \exp(-a(\theta - b))}$$
- Estimates student latent ability $\theta$ and calculates **Fisher Information Gain** for question selection.

### 4. Ebbinghaus Forgetting & Retention Decay
$$R(t) = \exp\left(-\frac{\ln 2}{S} \cdot t\right), \quad S = S_0 \cdot (1 + 0.5 \cdot \text{Reviews})$$

### 5. Multi-Factor Priority Engine
$$\text{Priority} = \text{Gap} \times \text{ExamImportance} \times \text{PrerequisiteImpact} \times (1 + 0.5 \times \text{ForgettingRisk})$$

### 6. UPSC Written Answer Studio (7-Pillar Rubric)
- Understanding (2.5) • Structure (2.0) • Relevance (2.0) • Arguments (2.5) • Case Laws/Data (2.5) • Clarity (2.0) • Conclusion (1.5) = **15.0 Marks**.

---

## 🛠️ Quick Start

### Installation
```bash
pip install fastapi uvicorn sqlalchemy networkx numpy scipy pydantic pytest pytest-asyncio
```

### Run Tests
```bash
python -m pytest -v tests/
```

### Launch Platform
```bash
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Open **http://127.0.0.1:8000/** in your browser.
