# ADAPTIVE COGNITIVE MODELING ENGINE
## Engineer-Grade Blueprint and Implementation Reference
### Version 1.0 | Extracted from: Adaptive Student Intelligence Platform v3.0

---

> This document is a complete, self-contained engineering reference.
> You can take the algorithms described here and implement them into any domain:
> education, employee training, medical licensing exams, corporate skill assessments,
> game progression systems, language learning apps, or any system where a human
> learns something over time and you need to track how well they know it.
> No prior knowledge of the source codebase is required to use this document.

---

## TABLE OF CONTENTS

1. What This Algorithm Does in Simple Words
2. The Core Problem It Solves
3. The Five Engines That Make It Work
4. Engine 1: Multi-Factor Mastery Engine
5. Engine 2: Bayesian Knowledge Tracing (BKT)
6. Engine 3: Item Response Theory (IRT 3PL)
7. Engine 4: Ebbinghaus Forgetting and Retention Engine
8. Engine 5: Prerequisite DAG and Root-Cause Gap Interceptor
9. How All Five Engines Work Together
10. The Dynamic Priority Score Formula
11. The Roadmap Generation Pipeline
12. The Cognitive Error Classifier
13. Database Schema Required
14. Step-by-Step Build Guide (Manual Implementation)
15. How to Port This to Any Domain
16. Prompts to Generate This Algorithm with an AI
17. Quick Reference: All Formulas in One Place
18. Verification and Testing Checklist

---

## 1. WHAT THIS ALGORITHM DOES IN SIMPLE WORDS

Imagine a very smart tutor who watches every single thing a student does.

Not just whether they got the answer right or wrong. This tutor also watches:
- How long the student took to answer
- Whether the student was consistent or guessed randomly
- Whether the student is likely to forget the topic by next week
- Whether the student missed a basic foundational topic that is blocking all advanced topics
- Whether the student truly knows something or just got lucky on a question

After observing all of this, the tutor builds a personalised study plan. The plan does not tell the student to just read Chapter 5 again. It tells the student the exact reason: "You need to repair Newton's Second Law (mastery 38%) before we even attempt Energy Conservation because you cannot solve energy problems without a solid force foundation."

This algorithm is that tutor. It runs on math, not guesswork.

The algorithm outputs one thing: a ranked, ordered, reason-explained list of exactly what the user should study next and why.

---

## 2. THE CORE PROBLEM IT SOLVES

### The Traditional System Failure

Traditional assessment systems ask: "Did you get it right or wrong?"

They compute a score like 67% and say: "You are weak in Chemistry. Study more Chemistry."

This is useless because:
- 67% on easy questions does not equal 67% on hard questions
- A student might have gotten lucky on 3 questions
- A student might have known the answer 3 weeks ago but forgot it today
- A student might be failing Thermodynamics not because of Thermodynamics itself but because their Algebra fundamentals are broken
- A student who takes 2 minutes per question is different from one who takes 20 seconds

### What This Algorithm Measures Instead

This algorithm tracks the true latent cognitive state of the learner. That means:

1. Latent ability (theta): The real hidden capability, estimated across difficulty levels
2. Knowledge state probability: The statistical probability that the student actually knows the concept
3. Memory retention: How much of what was learned is still accessible today
4. Foundational dependency: What earlier concepts are broken and silently causing failures downstream
5. Error type: Not just wrong, but WHY wrong (concept misunderstanding vs calculation slip vs guessing)

---

## 3. THE FIVE ENGINES THAT MAKE IT WORK

The complete algorithm is composed of five sub-engines. They each solve a different piece of the problem.

```
INPUT: Student answers a question (or a set of questions)
            |
            v
ENGINE 1: MULTI-FACTOR MASTERY ENGINE
Computes composite mastery score M in [0.0, 1.0]
Factors: accuracy, difficulty weighting, recent trend, speed, consistency, retention
            |
            v
ENGINE 2: BAYESIAN KNOWLEDGE TRACING
Tracks the hidden probability P(L) that the student truly knows the concept.
Accounts for lucky guesses and unlucky slips.
            |
            v
ENGINE 3: ITEM RESPONSE THEORY (IRT 3PL)
Estimates latent ability theta across the difficulty spectrum
using question discrimination and guessing correction.
            |
            v
ENGINE 4: EBBINGHAUS FORGETTING CURVE
Decays the mastery score over elapsed time. Flags concepts that
need a spaced-repetition review before they are forgotten.
            |
            v
ENGINE 5: PREREQUISITE DAG + ROOT-CAUSE GAP INTERCEPTOR
Uses a Directed Acyclic Graph to find which foundational concept
is the TRUE root cause of failures in advanced topics.
            |
            v
OUTPUT: Sorted, Prioritized Roadmap with Human-Readable Reasons
```

---

## 4. ENGINE 1: MULTI-FACTOR MASTERY ENGINE

### What it does

It replaces a simple percentage score with a weighted composite score that is much more accurate.

### The Formula

```
M = (w1 * Acc) + (w2 * DiffPerf) + (w3 * RecentAcc) + (w4 * Retention) + (w5 * Consistency) + (w6 * Speed)
```

Where M is in the range [0.0, 1.0] and the default weights are:

| Factor | Variable | Weight | What it Measures |
|---|---|---|---|
| Historical Accuracy | Acc | 0.30 | Overall correct / total attempted |
| Difficulty-Weighted Performance | DiffPerf | 0.20 | Hard questions count more than easy ones |
| Recent Accuracy | RecentAcc | 0.15 | Only the last 5 attempts (trend) |
| Retention Score | R(t) | 0.15 | Memory decay from last practice |
| Consistency | Consist | 0.10 | Low variance in performance = higher bonus |
| Speed Factor | Speed | 0.10 | Time taken vs expected time |

### How Each Factor is Computed

Historical Accuracy:
```
Acc = correct_answers / total_attempts
```

Difficulty-Weighted Performance:
```
For each question:
    weight = 0.5 + difficulty_score
    if correct: add weight to numerator

DiffPerf = sum(weights where correct) / sum(all weights)
```

Recent Accuracy:
```
RecentAcc = correct in last 5 attempts / 5
```

Consistency Factor:
```
scores = [1.0 if correct else 0.0 for each attempt]
mean = average(scores)
variance = average((score - mean)^2 for each score)
Consistency = max(0.0, 1.0 - variance)
```

Speed Factor:
```
ratio = actual_time_taken / expected_time_for_question

if ratio < 0.2:   Speed = 0.50   (too fast = probably guessed)
if ratio <= 1.0:  Speed = 1.00   (on-time = good)
if ratio <= 2.0:  Speed = max(0.60, 1.0 - 0.4 * (ratio - 1.0))
if ratio > 2.0:   Speed = max(0.30, 0.60 - 0.15 * (ratio - 2.0))
```

Confidence in the Mastery Estimate:
```
sample_factor = 1.0 - exp(-N / 5.0)
consistency_bonus = max(0.0, 1.0 - variance) * 0.15
Confidence = 0.85 * sample_factor + consistency_bonus
Confidence is clipped to [0.10, 0.98]
```

### Python Implementation

```python
import math

class MasteryConfig:
    WEIGHT_ACCURACY: float = 0.30
    WEIGHT_DIFFICULTY_PERF: float = 0.20
    WEIGHT_RECENT_ACCURACY: float = 0.15
    WEIGHT_RETENTION: float = 0.15
    WEIGHT_CONSISTENCY: float = 0.10
    WEIGHT_SPEED: float = 0.10
    SAMPLE_SIZE_HALF_CONFIDENCE: float = 5.0

def calculate_speed_factor(avg_time_sec: float, expected_time_sec: float) -> float:
    if expected_time_sec <= 0:
        expected_time_sec = 60.0
    ratio = avg_time_sec / expected_time_sec
    if ratio <= 0.2:
        return 0.50
    elif ratio <= 1.0:
        return 1.0
    elif ratio <= 2.0:
        return max(0.60, 1.0 - 0.4 * (ratio - 1.0))
    else:
        return max(0.30, 0.60 - 0.15 * (ratio - 2.0))

def calculate_confidence(attempt_count: int, variance: float = 0.0) -> float:
    if attempt_count <= 0:
        return 0.10
    sample_factor = 1.0 - math.exp(-attempt_count / 5.0)
    consistency_bonus = max(0.0, 1.0 - variance) * 0.15
    confidence = 0.85 * sample_factor + consistency_bonus
    return round(min(max(confidence, 0.10), 0.98), 3)

def compute_mastery(attempts: list, config: MasteryConfig = None) -> dict:
    """
    attempts: list of dicts with keys:
        is_correct (bool), difficulty (float 0-1), time_taken_seconds (int)
    """
    if config is None:
        config = MasteryConfig()
    if not attempts:
        return {"mastery": 0.0, "confidence": 0.10}

    total = len(attempts)
    correct = sum(1 for a in attempts if a["is_correct"])
    historical_accuracy = correct / total

    recent = attempts[-5:]
    recent_accuracy = sum(1 for a in recent if a["is_correct"]) / len(recent)

    diff_score = 0.0
    diff_total = 0.0
    for a in attempts:
        d = a.get("difficulty", 0.5)
        w = 0.5 + d
        diff_total += w
        if a["is_correct"]:
            diff_score += w
    difficulty_performance = diff_score / max(diff_total, 1e-6)

    avg_time = sum(a.get("time_taken_seconds", 60) for a in attempts) / total
    speed = calculate_speed_factor(avg_time, 60.0)

    scores = [1.0 if a["is_correct"] else 0.0 for a in attempts]
    mean = sum(scores) / len(scores)
    variance = sum((s - mean) ** 2 for s in scores) / len(scores) if len(scores) > 1 else 0.25
    consistency = max(0.0, 1.0 - variance)

    mastery = (
        config.WEIGHT_ACCURACY * historical_accuracy +
        config.WEIGHT_DIFFICULTY_PERF * difficulty_performance +
        config.WEIGHT_RECENT_ACCURACY * recent_accuracy +
        config.WEIGHT_RETENTION * 1.0 +
        config.WEIGHT_CONSISTENCY * consistency +
        config.WEIGHT_SPEED * speed
    )
    mastery = round(min(max(mastery, 0.0), 1.0), 3)
    confidence = calculate_confidence(total, variance)

    return {"mastery": mastery, "confidence": confidence}
```

---

## 5. ENGINE 2: BAYESIAN KNOWLEDGE TRACING (BKT)

### What it does

The mastery score from Engine 1 is deterministic. BKT adds a probabilistic layer: it tracks the hidden cognitive state P(L), the probability that the student genuinely knows the concept.

A student can get a question right by guessing. A student can get a question wrong even if they know it (slip). BKT corrects for both.

### Four Parameters

| Symbol | Name | Default | Meaning |
|---|---|---|---|
| P(L0) | Initial Knowledge | 0.20 | Prior probability student already knows the concept |
| P(T) | Transition Probability | 0.15 | Probability of learning after each wrong attempt |
| P(G) | Guess Probability | 0.25 | Probability of getting it right without knowing |
| P(S) | Slip Probability | 0.10 | Probability of getting it wrong despite knowing |

### The Update Equations

After a correct answer:
```
P(L | correct) = P(L) * (1 - P(S))
                 ----------------------------------------
                 P(L) * (1 - P(S)) + (1 - P(L)) * P(G)
```

After an incorrect answer:
```
P(L | incorrect) = P(L) * P(S)
                   -------------------------------------------
                   P(L) * P(S) + (1 - P(L)) * (1 - P(G))
```

After either update, apply the learning transition:
```
P(L_next) = P(L | observation) + (1 - P(L | observation)) * P(T)
```

### Python Implementation

```python
class BayesianKnowledgeTracing:
    def __init__(
        self,
        p_init: float = 0.20,
        p_transit: float = 0.15,
        p_guess: float = 0.25,
        p_slip: float = 0.10
    ):
        self.p_init = p_init
        self.p_transit = p_transit
        self.p_guess = p_guess
        self.p_slip = p_slip

    def update_single_step(self, current_p_known: float, is_correct: bool) -> float:
        p = current_p_known
        if is_correct:
            numerator = p * (1.0 - self.p_slip)
            denominator = numerator + (1.0 - p) * self.p_guess
        else:
            numerator = p * self.p_slip
            denominator = numerator + (1.0 - p) * (1.0 - self.p_guess)

        p_learned = numerator / max(denominator, 1e-7)
        p_next = p_learned + (1.0 - p_learned) * self.p_transit
        return round(min(max(p_next, 0.01), 0.99), 3)

    def compute_sequence_mastery(self, response_sequence: list) -> float:
        p = self.p_init
        for is_correct in response_sequence:
            p = self.update_single_step(p, is_correct)
        return p
```

---

## 6. ENGINE 3: ITEM RESPONSE THEORY (IRT 3PL)

### What it does

IRT solves the problem that not all questions are equally useful. A very easy question gives almost no information about the student's ability. IRT computes a latent ability score theta on a standardized scale from -3.0 to +3.0.

### The 3PL Probability Curve

For a student with ability theta answering question i:

```
P(correct | theta) = c_i + (1 - c_i) / (1 + exp(-a_i * (theta - b_i)))
```

Three Parameters Per Question:

| Symbol | Name | Typical Range | Meaning |
|---|---|---|---|
| a_i | Discrimination | 0.5 to 2.5 | How well this question separates high vs low ability students |
| b_i | Difficulty | -2.5 to +2.5 | Ability level at which student has 50% chance of correct answer |
| c_i | Guessing | 0.20 to 0.25 | Minimum probability of correct answer (lucky guess floor) |

### Converting Difficulty to b Parameter

```
clamped = clamp(difficulty, 0.05, 0.95)
b = log(clamped / (1.0 - clamped)) * 1.5
```

### Newton-Raphson Ability Estimation

```
theta_0 = 0.0

For each iteration:
    score_sum = 0
    info_sum = 0

    For each response (is_correct, difficulty, discrimination):
        b = convert_difficulty(difficulty)
        a = discrimination
        P = probability_correct(theta, b, a, c=0.20)
        u = 1.0 if is_correct else 0.0

        score_sum += a * (u - P)
        info_sum += a^2 * P * (1 - P)

    delta = score_sum / info_sum
    delta = clamp(delta, -0.75, +0.75)
    theta = theta + delta

    if abs(delta) < 0.01:
        break

theta = clamp(theta, -3.0, +3.0)
```

### Python Implementation

```python
import math

class ItemResponseTheory:

    @staticmethod
    def difficulty_to_b_parameter(difficulty_01: float) -> float:
        clamped = min(max(difficulty_01, 0.05), 0.95)
        return round(math.log(clamped / (1.0 - clamped)) * 1.5, 3)

    @staticmethod
    def probability_correct(
        theta: float,
        difficulty_b: float,
        discrimination_a: float = 1.0,
        guessing_c: float = 0.25
    ) -> float:
        z = discrimination_a * (theta - difficulty_b)
        z = max(min(z, 20.0), -20.0)
        p_logistic = 1.0 / (1.0 + math.exp(-z))
        return guessing_c + (1.0 - guessing_c) * p_logistic

    @classmethod
    def estimate_student_ability(
        cls,
        responses: list,
        initial_theta: float = 0.0,
        max_iterations: int = 25
    ) -> float:
        if not responses:
            return initial_theta

        theta = initial_theta
        for _ in range(max_iterations):
            score_sum = 0.0
            info_sum = 0.0

            for is_correct, diff_01, disc in responses:
                b = cls.difficulty_to_b_parameter(diff_01)
                a = disc if disc > 0 else 1.0
                P = cls.probability_correct(theta, b, a, guessing_c=0.20)
                u = 1.0 if is_correct else 0.0

                score_sum += a * (u - P)
                info_sum += (a ** 2) * P * (1.0 - P)

            if info_sum <= 1e-5:
                break

            delta = score_sum / info_sum
            delta = max(min(delta, 0.75), -0.75)
            theta += delta

            if abs(delta) < 0.01:
                break

        return round(min(max(theta, -3.0), 3.0), 3)
```

---

## 7. ENGINE 4: EBBINGHAUS FORGETTING AND RETENTION ENGINE

### What it does

A student might have had mastery = 0.85 for a concept two weeks ago. If they have not practiced it since, their effective mastery today might be only 0.60 because memory decays.

This engine tracks memory decay and generates a forgetting risk score that raises priority for concepts the student is about to forget.

### The Ebbinghaus Forgetting Curve

```
R(t) = exp(-t / S)
```

Where:
- R(t) is the retention fraction at time t (days since last practice)
- S is the memory stability
- t is the number of days since last practice

### Memory Stability Increases With Reviews

```
S = S_base * (1.0 + 0.5 * review_count)
```

Where S_base = 7 days by default.

### The Decay Constant

```
decay_constant = ln(2) / S
R(t) = exp(-decay_constant * t)
```

### Effective Mastery After Decay

```
retention_clamped = max(floor_retention, min(1.0, R(t)))
effective_mastery = base_mastery * retention_clamped
forgetting_risk = max(0.0, 1.0 - retention_clamped)
```

### Python Implementation

```python
import math
import datetime

class ForgettingModel:
    def __init__(
        self,
        base_half_life_days: float = 7.0,
        reinforcement_multiplier: float = 0.50,
        floor_retention: float = 0.35
    ):
        self.base_half_life_days = base_half_life_days
        self.reinforcement_multiplier = reinforcement_multiplier
        self.floor_retention = floor_retention

    def calculate_retention(
        self,
        base_mastery: float,
        last_practiced_at: datetime.datetime,
        review_count: int = 0,
        now: datetime.datetime = None
    ) -> dict:
        if base_mastery <= 0.0 or not last_practiced_at:
            return {
                "retention_score": 1.0,
                "effective_mastery": base_mastery,
                "forgetting_risk": 0.0,
                "days_since_practice": 0.0
            }

        now = now or datetime.datetime.now(datetime.timezone.utc)
        elapsed_seconds = max(0.0, (now - last_practiced_at).total_seconds())
        days_elapsed = elapsed_seconds / 86400.0

        stability_days = self.base_half_life_days * (1.0 + review_count * self.reinforcement_multiplier)
        decay_constant = math.log(2) / stability_days

        retention = math.exp(-decay_constant * days_elapsed)
        retention_clamped = max(self.floor_retention, min(1.0, retention))

        effective_mastery = round(base_mastery * retention_clamped, 3)
        forgetting_risk = round(max(0.0, 1.0 - retention_clamped), 3)

        return {
            "retention_score": round(retention_clamped, 3),
            "effective_mastery": effective_mastery,
            "forgetting_risk": forgetting_risk,
            "days_since_practice": round(days_elapsed, 2)
        }
```

### Practical Retention Reference Table

| Days Since Practice | Reviews = 0 | Reviews = 2 | Reviews = 6 |
|---|---|---|---|
| 1 day | 91% | 95% | 97% |
| 3 days | 75% | 86% | 92% |
| 7 days | 50% | 71% | 84% |
| 14 days | 35% | 50% | 71% |
| 30 days | 35% (floor) | 35% (floor) | 50% |

---

## 8. ENGINE 5: PREREQUISITE DAG AND ROOT-CAUSE GAP INTERCEPTOR

### What it does

This is the most intellectually powerful engine in the entire system.

The core insight: if a student keeps failing an advanced topic, the real reason is often that a foundational topic from earlier was never properly mastered.

Traditional systems say "practice more Thermodynamics." This engine says "you cannot master Thermodynamics because your Algebra fundamentals are broken. Fix Algebra first."

### The Directed Acyclic Graph (DAG)

Every concept in the curriculum is a node in a graph. Every dependency between concepts is a directed edge:

```
Newton's Laws ----> Conservation of Momentum ----> Rotational Dynamics
    |                                                       |
    v                                                       v
Free Body Diagrams ---> Torque ---> Angular Momentum ---> Gyroscopic Effects
```

A directed edge from A to B means "you must know A before B makes sense."

### Building the Graph

Use NetworkX (Python library for graph operations):

```python
import networkx as nx

graph = nx.DiGraph()

graph.add_node("concept_001", name="Newton's Second Law", subject="Physics")
graph.add_edge("concept_001", "concept_007", strength=0.9, relationship="prerequisite")
```

### Prerequisite Impact Score

How important is concept X? Measure how many other concepts it unlocks:

```python
def get_prerequisite_impact(concept_id: str) -> float:
    descendants = nx.descendants(graph, concept_id)
    total_nodes = len(graph.nodes)
    direct_out = len(list(graph.successors(concept_id)))
    downstream_ratio = len(descendants) / max(total_nodes - 1, 1)
    impact = 0.4 * min(direct_out / 3.0, 1.0) + 0.6 * downstream_ratio
    return round(min(max(impact, 0.1), 1.0), 3)
```

### Root-Cause Gap Detection Algorithm

```python
def analyze_prerequisite_chain(
    student_id: str,
    target_concept_id: str,
    mastery_threshold: float = 0.60
) -> dict:

    ancestors = get_all_ancestors_topological(target_concept_id)

    broken = []
    for ancestor_id in ancestors:
        student_mastery = get_student_mastery(student_id, ancestor_id)
        if student_mastery < mastery_threshold:
            broken.append({
                "concept_id": ancestor_id,
                "name": get_concept_name(ancestor_id),
                "mastery": student_mastery,
                "required": mastery_threshold
            })

    return {
        "has_prerequisite_gaps": len(broken) > 0,
        "broken_prerequisites": broken,
        "recommended_first_concept": broken[0]["concept_id"] if broken else target_concept_id
    }
```

### The Interception Logic in the Roadmap

```python
prereq_result = analyze_prerequisite_chain(student_id, target_concept_id)

if prereq_result["has_prerequisite_gaps"]:
    for broken in prereq_result["broken_prerequisites"]:
        roadmap_actions.append(RoadmapAction(
            concept_id=broken["concept_id"],
            priority_score=0.95,
            reasons=[
                f"Root foundational gap blocking '{target_concept_name}'",
                f"Current mastery {int(broken['mastery']*100)}% - needs 70% to unlock downstream"
            ]
        ))

roadmap_actions.append(RoadmapAction(concept_id=target_concept_id, ...))
```

---

## 9. HOW ALL FIVE ENGINES WORK TOGETHER

Complete flow when a student submits quiz answers:

```
STEP 1: Student submits quiz answers
        Record: question_id, student_answer, correct_answer,
                time_taken_seconds, difficulty, discrimination

STEP 2: Error Classifier runs on each wrong answer
        Classify: CONCEPTUAL_ERROR, CALCULATION_ERROR,
                  FORMULA_SELECTION_ERROR, SIGN_ERROR, GUESS, etc.

STEP 3: IRT Engine estimates global theta
        Input: list of (is_correct, difficulty, discrimination) for all questions
        Output: theta in [-3.0, +3.0]
        Update student record: irt_ability = theta

STEP 4: For each CONCEPT touched in the quiz:
        a. BKT Engine updates P(L) for that concept
        b. Multi-Factor Mastery Engine computes composite score
        c. Ebbinghaus Engine applies retention decay
        d. Update StudentConceptMastery record

STEP 5: Priority Engine ranks ALL concepts
        For each concept in the curriculum:
            knowledge_gap = 1.0 - effective_mastery
            prereq_impact = get_prerequisite_impact(concept_id)
            prereq_check = analyze_prerequisite_chain(student_id, concept_id)
            priority_score = weighted formula
            reasons = human-readable explanations

STEP 6: Roadmap Generator builds the action plan
        Take the top N priority concepts
        For each: intercept broken prerequisites (insert them first)
        Determine action type based on mastery level
        Save new Roadmap record (supersedes previous one)

STEP 7: Return roadmap to frontend for display
```

---

## 10. THE DYNAMIC PRIORITY SCORE FORMULA

```
Priority = (gap * w_gap) + (exam_weight * w_exam) + (prereq_impact * w_prereq) + (forgetting_risk * w_decay) + ((1 - confidence) * w_uncertainty)
```

### Default Weights

| Factor | Variable | Weight | Why |
|---|---|---|---|
| Knowledge Gap | 1.0 - mastery | 0.35 | Main signal: what does the student not know |
| Domain Importance | exam_relevance | 0.25 | Higher-stakes topics get prioritized |
| Prerequisite Impact | downstream_unlock_ratio | 0.25 | Foundational topics unlock more downstream topics |
| Forgetting Risk | 1.0 - retention | 0.08 | Prevent memory decay before it happens |
| Uncertainty Factor | 1.0 - confidence | 0.07 | Low data on a concept increases priority |

### Domain-Specific Amplifiers

```python
if domain == "MEDICAL" and subject == "Anatomy":
    exam_importance = min(1.0, exam_importance * 1.25)

if domain == "LAW" and subject == "Constitutional":
    prereq_impact = min(1.0, prereq_impact * 1.20)
```

---

## 11. THE ROADMAP GENERATION PIPELINE

### The Action Type State Machine

```
if forgetting_risk > 0.40 AND mastery >= 0.50:
    -> RETENTION_DRILL (5 questions, 20 minutes, medium difficulty)

elif mastery < 0.35:
    -> FOUNDATION_REBUILD (5 questions, 45 minutes, easy-medium difficulty)

elif mastery < 0.55:
    -> SPEED_PRACTICE (7 questions, 30 minutes, medium difficulty)

elif mastery < 0.75:
    -> MULTI_CONCEPT_DRILL (6 questions, 35 minutes, medium-hard difficulty)

elif mastery < 0.88:
    -> ADVANCED_PRACTICE (5 questions, 40 minutes, hard difficulty)

else:
    -> TRANSFER_TEST (4 questions, 20 minutes, very hard difficulty)
```

### Roadmap Versioning

Every time the student completes a quiz, the old roadmap is marked SUPERSEDED and a new one is generated from scratch with the latest data.

---

## 12. THE COGNITIVE ERROR CLASSIFIER

### The Taxonomy

| Error Type | Trigger Condition | Meaning |
|---|---|---|
| CONCEPTUAL_ERROR | Distractor tagged CONCEPTUAL_ERROR OR time > 2x expected | Misunderstood a law, rule, or definition |
| CALCULATION_ERROR | Distractor tagged CALCULATION_ERROR | Arithmetic mistake despite knowing the formula |
| FORMULA_SELECTION_ERROR | Distractor tagged FORMULA_SELECTION_ERROR | Applied the wrong equation |
| SIGN_ERROR | Distractor tagged SIGN_ERROR | Inverted a sign, ratio, or direction |
| GUESS | time_taken < 20% of expected AND wrong | Submitted too fast to have thought about it |
| TIME_PRESSURE | No answer AND time_taken >= expected | Ran out of time |
| SKIPPED | No answer AND fast | Chose to skip |
| UNKNOWN | None of the above | Standard wrong attempt |

### Python Implementation

```python
def classify_error(
    distractor_explanations: dict,
    student_answer: str,
    correct_answer: str,
    time_taken_seconds: int,
    estimated_time_seconds: int = 60
) -> dict:

    if student_answer == correct_answer:
        return {"error_type": None, "note": "Correct response"}

    if not student_answer:
        if time_taken_seconds >= estimated_time_seconds:
            return {"error_type": "TIME_PRESSURE", "note": "Timed out"}
        return {"error_type": "SKIPPED", "note": "Question skipped"}

    if distractor_explanations and student_answer in distractor_explanations:
        raw = distractor_explanations[student_answer]
        for tag in [
            "CONCEPTUAL_ERROR", "FORMULA_SELECTION_ERROR", "CALCULATION_ERROR",
            "SIGN_ERROR", "UNIT_ERROR", "READING_ERROR", "CARELESS_ERROR"
        ]:
            if tag in raw:
                return {"error_type": tag, "note": raw}

    if time_taken_seconds < max(10, estimated_time_seconds * 0.20):
        return {"error_type": "GUESS", "note": f"Answer submitted in {time_taken_seconds}s"}

    if time_taken_seconds > estimated_time_seconds * 2.0:
        return {"error_type": "CONCEPTUAL_ERROR", "note": f"Long deliberation suggests conceptual struggle"}

    return {"error_type": "UNKNOWN", "note": "Standard incorrect attempt"}
```

---

## 13. DATABASE SCHEMA REQUIRED

```sql
CREATE TABLE students (
    student_id      TEXT PRIMARY KEY,
    name            TEXT,
    target_exam     TEXT,
    created_at      DATETIME
);

CREATE TABLE concepts (
    concept_id          TEXT PRIMARY KEY,
    topic_id            TEXT,
    name                TEXT NOT NULL,
    description         TEXT,
    exam_relevance      REAL DEFAULT 0.80,
    difficulty_weight   REAL DEFAULT 0.50,
    estimated_minutes   INT DEFAULT 45
);

CREATE TABLE prerequisites (
    prereq_id           TEXT PRIMARY KEY,
    from_concept_id     TEXT,
    to_concept_id       TEXT,
    strength            REAL DEFAULT 1.0,
    relationship_type   TEXT DEFAULT 'prerequisite'
);

CREATE TABLE student_concept_mastery (
    id              INT PRIMARY KEY AUTOINCREMENT,
    student_id      TEXT,
    concept_id      TEXT,
    mastery         REAL DEFAULT 0.0,
    bkt_mastery     REAL DEFAULT 0.20,
    irt_ability     REAL DEFAULT 0.0,
    confidence      REAL DEFAULT 0.10,
    attempts_count  INT DEFAULT 0,
    correct_count   INT DEFAULT 0,
    forgetting_risk REAL DEFAULT 0.0,
    last_practiced_at DATETIME,
    review_count    INT DEFAULT 0,
    updated_at      DATETIME
);

CREATE TABLE assessment_attempts (
    attempt_id          TEXT PRIMARY KEY,
    student_id          TEXT,
    test_tier           TEXT,
    score_percentage    REAL,
    irt_theta_estimated REAL,
    created_at          DATETIME
);

CREATE TABLE student_attempt_items (
    id                  INT PRIMARY KEY AUTOINCREMENT,
    attempt_id          TEXT,
    question_id         TEXT,
    concept_id          TEXT,
    student_answer      TEXT,
    correct_answer      TEXT,
    is_correct          BOOLEAN,
    difficulty          REAL,
    discrimination      REAL DEFAULT 1.0,
    time_taken_seconds  INT,
    error_type          TEXT,
    distractor_note     TEXT,
    timestamp           DATETIME
);

CREATE TABLE roadmaps (
    roadmap_id      TEXT PRIMARY KEY,
    student_id      TEXT,
    version         INT DEFAULT 1,
    status          TEXT DEFAULT 'ACTIVE',
    trigger_event   TEXT,
    created_at      DATETIME
);

CREATE TABLE roadmap_actions (
    id                      INT PRIMARY KEY AUTOINCREMENT,
    roadmap_id              TEXT,
    sequence_order          INT,
    action_type             TEXT,
    concept_id              TEXT,
    priority_score          REAL,
    reasons                 TEXT,
    target_questions_count  INT,
    estimated_minutes       INT,
    target_difficulty       REAL,
    is_completed            BOOLEAN DEFAULT FALSE
);
```

---

## 14. STEP-BY-STEP BUILD GUIDE (MANUAL IMPLEMENTATION)

### Phase 1: Data Foundation (Week 1)

1. Define your knowledge domain hierarchy:
   Domain -> Category -> Module -> Topic -> Concept

2. Create the concepts table and populate it with your curriculum

3. Map out prerequisites (draw on paper first, then encode as database rows):
   Example: "Base Cases" requires "Function Calls" requires "Variables"

4. Set exam_relevance scores per concept (0.0 to 1.0)

5. Set difficulty_weight per concept (0.0 = very easy, 1.0 = very hard)

### Phase 2: Question Bank (Week 1-2)

1. Create a questions table with:
   question_text, correct_answer, options, difficulty, discrimination,
   concept_id, distractor_explanations (JSON dict), estimated_time_seconds

2. Tag at least 5 questions per concept

3. For each wrong option, write a 1-sentence distractor note explaining what cognitive error leads to that answer

### Phase 3: Assessment Engine (Week 2)

1. Build the quiz selection endpoint: select N questions balanced across domains

2. Build the submit endpoint:
   - For each item: call classify_error()
   - Collect (is_correct, difficulty, discrimination) tuples

3. Run IRT: call estimate_student_ability() -> theta

4. For each concept touched: run BKT update on the response sequence

5. For each concept touched: run compute_mastery() on all historical attempts

6. For each concept touched: run calculate_retention() with last_practiced_at

7. Save all results to student_concept_mastery table

### Phase 4: Priority and Roadmap Engine (Week 3)

1. Build the CurriculumGraph class using NetworkX

2. Implement get_prerequisite_impact() for each concept

3. Implement analyze_prerequisite_chain() for root-cause detection

4. Implement calculate_priority() with the weighted formula

5. Implement rank_all_priorities() to sort all concepts for a student

6. Implement generate_roadmap() with prerequisite interception

7. Implement determine_action_type() based on mastery level

### Phase 5: Frontend Display (Week 3-4)

1. Step Sequence View: Show roadmap actions as numbered cards with reasons
2. Graph View: Render the prerequisite DAG with color-coded nodes
3. Heatmap View: Grid of all concepts showing mastery percentage
4. AI Mentor: Intent classifier plus template slot-filler

### Phase 6: Testing (Week 4)

1. Unit test BKT: Feed known sequences, verify convergence
2. Unit test IRT: Perfect score on easy questions -> theta > 0
3. Unit test Ebbinghaus: 14 days elapsed -> retention < 0.70
4. Unit test DAG: Broken prerequisite appears first in roadmap
5. Integration test: Register student -> quiz -> verify sensible roadmap

---

## 15. HOW TO PORT THIS TO ANY DOMAIN

The only domain-specific parts are:
1. The concept hierarchy and prerequisite graph
2. The exam_relevance weights per concept
3. The action_type labels
4. The weight multipliers in the priority formula

### Domain Mapping Table

| Original (Exam Prep) | Software Engineering | Corporate Sales | Medical Certification |
|---|---|---|---|
| Exam Track | Tech Stack | Product Line | Medical Specialty |
| Subject | Language Features | Sales Process Stage | Body System |
| Chapter | Module | Sales Category | Organ System |
| Concept | Skill | Specific Tactic | Procedure or Drug |
| Question | Coding Challenge | Role-Play Scenario | Case Study |
| Mastery 70% | Module proficiency | Quota attainment | Board pass rate |
| Prerequisite | Loops before Recursion | Product A before cross-sell | Anatomy before Pathology |

### Minimum Viable Port Checklist

- [ ] Concept hierarchy defined (3 levels minimum)
- [ ] Prerequisite edges defined
- [ ] Questions mapped to concepts
- [ ] Questions have difficulty scores
- [ ] Questions have distractor explanations (optional but valuable)
- [ ] Student attempt recording system (question_id, is_correct, time_taken)
- [ ] The five engine classes (copy and adapt from this document)

---

## 16. PROMPTS TO GENERATE THIS ALGORITHM WITH AN AI

Use these prompts with Claude, Gemini, ChatGPT, or any AI coding assistant to recreate each engine from scratch.

---

### PROMPT 1: Multi-Factor Mastery Engine

```
I am building an adaptive learning system. I need a Python class called MasteryEngine
that computes a composite mastery score for a learner on a specific skill or concept.

The score should be a weighted combination of these factors:
- Historical accuracy (correct / total attempts), weight = 0.30
- Difficulty-weighted performance (harder questions count more, use weight = 0.5 + difficulty), weight = 0.20
- Recent accuracy (only last 5 attempts), weight = 0.15
- Consistency factor (based on variance in scores - low variance = high consistency), weight = 0.10
- Speed factor (time taken vs expected time, with penalty for too fast and too slow), weight = 0.10
- Retention placeholder = 1.0 (Ebbinghaus applied separately), weight = 0.15

Speed factor rules:
  ratio = actual_time / expected_time
  ratio < 0.2: return 0.50 (probably guessed)
  ratio <= 1.0: return 1.0 (on time)
  ratio <= 2.0: return max(0.60, 1.0 - 0.4 * (ratio - 1.0))
  ratio > 2.0: return max(0.30, 0.60 - 0.15 * (ratio - 2.0))

Also include calculate_confidence(attempt_count, variance):
  confidence = 0.85 * (1 - exp(-N / 5.0)) + 0.15 * (1 - variance)
  clamp result to [0.10, 0.98]

Input to the main function is a list of attempt dicts with keys:
  is_correct (bool), difficulty (float 0-1), time_taken_seconds (int)

Return: {"mastery": float, "confidence": float}
```

---

### PROMPT 2: Bayesian Knowledge Tracing Engine

```
I need a Python class implementing standard Bayesian Knowledge Tracing (BKT)
to track a learner's hidden knowledge state P(L) for a specific skill.

Constructor parameters (all floats):
  p_init = 0.20 (prior: student does not know the concept)
  p_transit = 0.15 (probability of learning from each attempt)
  p_guess = 0.25 (probability of correct answer despite not knowing)
  p_slip = 0.10 (probability of wrong answer despite knowing)

Method 1: update_single_step(current_p_known: float, is_correct: bool) -> float
  If correct:
    P(L|correct) = P(L)*(1-S) / [P(L)*(1-S) + (1-P(L))*G]
  If incorrect:
    P(L|wrong) = P(L)*S / [P(L)*S + (1-P(L))*(1-G)]
  Apply transition:
    P(L_next) = P(L|obs) + (1-P(L|obs)) * T
  Include numerical stability: divide by max(denominator, 1e-7)
  Clamp result to [0.01, 0.99]

Method 2: compute_sequence_mastery(response_sequence: List[bool]) -> float
  Feed a sequence of True/False values through BKT starting from p_init
  Return final P(L)
```

---

### PROMPT 3: Item Response Theory (IRT 3PL) Engine

```
I need a Python class implementing 3-Parameter Logistic Item Response Theory (IRT 3PL)
to estimate learner ability theta from a set of question responses.

Static Method 1: difficulty_to_b_parameter(difficulty_01: float) -> float
  Convert normalized difficulty [0,1] to IRT b parameter [-2.5, +2.5]:
  clamped = clamp(difficulty, 0.05, 0.95)
  b = log(clamped / (1 - clamped)) * 1.5

Static Method 2: probability_correct(theta, difficulty_b, discrimination_a=1.0, guessing_c=0.25) -> float
  P = c + (1-c) / (1 + exp(-a*(theta - b)))
  Clamp z = a*(theta-b) to [-20, +20] for numerical stability

Class Method: estimate_student_ability(responses, initial_theta=0.0, max_iterations=25) -> float
  responses is a list of (is_correct, difficulty_01, discrimination) tuples
  Use Newton-Raphson maximum likelihood estimation:
    For each iteration:
      score_sum = sum of a * (u - P) for each response
      info_sum = sum of a^2 * P * (1-P) for each response
    delta = score_sum / info_sum
    Clamp delta to [-0.75, +0.75] for stability
    theta += delta
    Stop if abs(delta) < 0.01 or info_sum < 1e-5
  Return theta clamped to [-3.0, +3.0]
```

---

### PROMPT 4: Ebbinghaus Forgetting Curve Engine

```
I need a Python class called ForgettingModel that implements the Ebbinghaus
exponential forgetting curve for a spaced repetition learning system.

Constructor parameters:
  base_half_life_days = 7.0 (memory stable for 7 days after one practice session)
  reinforcement_multiplier = 0.50 (each review adds 50% more memory stability)
  floor_retention = 0.35 (mastery never drops below 35% completely)

Method: calculate_retention(base_mastery, last_practiced_at, review_count=0, now=None) -> dict

Complete logic:
  If no last_practiced_at: return retention=1.0, no decay applied

  days_elapsed = (now - last_practiced_at).total_seconds() / 86400

  stability_days = base_half_life_days * (1.0 + review_count * reinforcement_multiplier)
  decay_constant = ln(2) / stability_days

  retention = exp(-decay_constant * days_elapsed)
  retention_clamped = max(floor_retention, min(1.0, retention))

  effective_mastery = base_mastery * retention_clamped
  forgetting_risk = max(0.0, 1.0 - retention_clamped)

Return dict with:
  retention_score (float), effective_mastery (float),
  forgetting_risk (float), days_since_practice (float)

Handle timezone-naive vs timezone-aware datetime comparison gracefully.
```

---

### PROMPT 5: Prerequisite DAG and Root-Cause Gap Detector

```
I need two Python classes using NetworkX to implement a prerequisite
knowledge graph with root-cause gap detection.

Class 1: CurriculumGraph(db_session, exam_id=None)

Build the graph from database in _build_graph():
  Query concepts and add as nodes with attributes:
    name, subject, chapter_name, topic_name, exam_relevance, difficulty_weight, estimated_minutes
  Query prerequisites and add as directed edges:
    from_concept_id -> to_concept_id with strength and relationship_type

Method get_all_prerequisites(concept_id) -> List[str]:
  Use nx.ancestors() to get all ancestor nodes
  Use nx.topological_sort() on the ancestor subgraph
  Return ordered list (oldest foundational concept first)

Method get_prerequisite_impact(concept_id) -> float:
  impact = 0.4 * min(direct_successors / 3.0, 1.0) + 0.6 * (total_descendants / total_nodes)
  Clamp to [0.1, 1.0]

Class 2: PrerequisiteResolver(db_session, curriculum_graph)

Method analyze_prerequisite_chain(student_id, target_concept_id, mastery_threshold=0.60) -> dict:
  1. Get all ancestors in topological order
  2. For each ancestor: query student mastery from database
  3. If mastery < threshold: add to broken list
  4. Return:
     {
       has_prerequisite_gaps: bool,
       broken_prerequisites: list of {concept_id, name, mastery, required_threshold},
       recommended_first_concept: str (first broken prereq, or target if none broken)
     }
```

---

### PROMPT 6: Priority Engine

```
I need a Python class called PriorityEngine that ranks all concepts by
how urgently a student should study them next, with human-readable explanations.

Constructor: __init__(db, exam_id, curriculum_graph, prereq_resolver)

Method calculate_priority(concept, mastery_record, student_id) -> dict:

Extract from mastery_record:
  mastery, confidence, forgetting_risk, attempts_count

Compute factors:
  knowledge_gap = 1.0 - mastery
  exam_importance = concept.exam_relevance
  prereq_impact = curriculum_graph.get_prerequisite_impact(concept.concept_id)
  prereq_check = prereq_resolver.analyze_prerequisite_chain(student_id, concept.concept_id)

Priority formula:
  raw_score = (
    knowledge_gap * 0.35 +
    exam_importance * 0.25 +
    prereq_impact * 0.25 +
    forgetting_risk * 0.08 +
    (1.0 - confidence) * 0.07
  )
  priority_score = clamp(raw_score, 0.05, 0.99)

Build human-readable reasons list (include all that apply):
  - If mastery < 0.40: "Critical knowledge gap (mastery X%)"
  - If mastery < 0.70 AND mastery >= 0.40: "Moderate mastery (X%) below target threshold"
  - If exam_importance >= 0.90: "High exam weight (X% relevance)"
  - If prereq_impact >= 0.60: "Key foundational concept unlocking [names of top 3 dependents]"
  - If forgetting_risk > 0.35: "Spaced repetition alert (X% forgetting risk)"
  - If has_prerequisite_gaps: "Notice: Prerequisite [name] should be mastered first"

Return: {concept_id, concept_name, priority_score, knowledge_gap, exam_importance,
         prereq_impact, forgetting_risk, has_unresolved_prerequisites, reasons}

Method rank_all_priorities(student_id) -> sorted list of all concept priorities
```

---

### PROMPT 7: Roadmap Generator

```
I need a Python class called RoadmapGenerator that creates a personalized,
ordered study plan for a student based on concept priorities and the prerequisite graph.

Method determine_action_type(mastery: float, forgetting_risk: float, domain: str) -> dict:
  Rules (check in this order):
  1. forgetting_risk > 0.40 AND mastery >= 0.50:
     action = "RETENTION_DRILL", questions = 5, minutes = 20, difficulty = 0.60
  2. mastery < 0.35:
     action = "FOUNDATION_REBUILD", questions = 5, minutes = 45, difficulty = 0.40
  3. mastery < 0.55:
     action = "SPEED_PRACTICE", questions = 7, minutes = 30, difficulty = 0.55
  4. mastery < 0.75:
     action = "MULTI_CONCEPT_DRILL", questions = 6, minutes = 35, difficulty = 0.70
  5. mastery < 0.88:
     action = "ADVANCED_PRACTICE", questions = 5, minutes = 40, difficulty = 0.85
  6. else:
     action = "TRANSFER_TEST", questions = 4, minutes = 20, difficulty = 0.85
  Return: {action_type, questions_count, estimated_minutes, target_difficulty}

Method generate_roadmap(student_id: str, max_actions: int = 6) -> list:
  Algorithm:
  1. ranked = priority_engine.rank_all_priorities(student_id)
  2. actions = [], visited = set()
  3. For each concept in ranked (stop when len(actions) >= max_actions):
     a. prereq_check = analyze_prerequisite_chain(student_id, concept_id)
     b. If broken prerequisites exist AND they are not in visited:
        For each broken prerequisite:
          Insert broken prerequisite as a roadmap action with priority_score = 0.95
          reasons = ["Root foundational gap blocking X", "Mastery Y% needs >= 70%"]
          Add to visited
     c. If target concept not in visited AND len(actions) < max_actions:
        Insert the target concept
        Add to visited
  4. Return list of action dicts with sequence_order, action_type, concept info, reasons
```

---

### PROMPT 8: Cognitive Error Classifier

```
I need a Python function classify_error() that determines WHY a student
got a question wrong, using both the answer they chose and the time they spent.

Parameters:
  distractor_explanations: dict mapping option_key -> explanation_string
    (explanation string may contain tags: CONCEPTUAL_ERROR, CALCULATION_ERROR, etc.)
  student_answer: str or None
  correct_answer: str
  time_taken_seconds: int
  estimated_time_seconds: int = 60

Classification logic (in order):
  1. If student_answer == correct_answer: return {error_type: None, note: "Correct"}
  2. If student_answer is None or empty:
     - If time_taken >= estimated: return TIME_PRESSURE
     - Else: return SKIPPED
  3. If distractor_explanations has student_answer as a key:
     - Check for these tags in order (return first match):
       CONCEPTUAL_ERROR, FORMULA_SELECTION_ERROR, CALCULATION_ERROR,
       SIGN_ERROR, UNIT_ERROR, READING_ERROR, CARELESS_ERROR
     - Return {error_type: tag, note: full_explanation_text}
  4. If time_taken < max(10, estimated * 0.20):
     - Return GUESS with note about fast submission
  5. If time_taken > estimated * 2.0:
     - Return CONCEPTUAL_ERROR with note about long deliberation
  6. Default: return UNKNOWN

Return format: {"error_type": str or None, "note": str}
```

---

### PROMPT 9: Full Assessment Submit Endpoint (FastAPI)

```
I am building a FastAPI backend for an adaptive learning platform.
I need a POST /api/assessments/submit endpoint.

Request body:
  attempt_id: str
  student_id: str
  responses: list of {question_id: str, student_answer: str, time_taken_seconds: int}

Processing logic:

Step 1: For each response:
  - Look up question from database (correct_answer, difficulty, discrimination,
    concept_id, distractor_explanations, estimated_time_seconds)
  - Determine is_correct = (student_answer == correct_answer)
  - Call classify_error() to get error_type and note
  - Create and save StudentAttemptItem record

Step 2: Collect all (is_correct, difficulty, discrimination) tuples
  Call ItemResponseTheory.estimate_student_ability(tuples) -> theta
  Update student's irt_ability field with theta

Step 3: Group all items by concept_id
  For each unique concept:
    a. Get ALL historical attempt items for this student + concept (including today's)
    b. Build response_sequence = [item.is_correct for item in all_historical_items]
    c. bkt = BayesianKnowledgeTracing()
       bkt_mastery = bkt.compute_sequence_mastery(response_sequence)
    d. attempts_dicts = [{"is_correct": i.is_correct, "difficulty": i.difficulty,
                          "time_taken_seconds": i.time_taken_seconds} for i in all_items]
       mastery_result = compute_mastery(attempts_dicts)
    e. Get existing mastery record for this student + concept (or create new)
       fm = ForgettingModel()
       decay_result = fm.calculate_retention(
           mastery_result["mastery"],
           existing_record.last_practiced_at,
           existing_record.review_count
       )
    f. Update StudentConceptMastery:
       mastery = decay_result["effective_mastery"]
       bkt_mastery = bkt_mastery
       irt_ability = theta (global, same for all concepts in this session)
       confidence = mastery_result["confidence"]
       forgetting_risk = decay_result["forgetting_risk"]
       last_practiced_at = datetime.utcnow()
       review_count += 1
       attempts_count += count of today's items for this concept

Step 4: Generate new roadmap
  roadmap = RoadmapGenerator(db, exam_id=student.target_exam)
  new_roadmap = roadmap.generate_roadmap(student_id)

Step 5: Return response:
  {
    score_percentage: float,
    total_questions: int,
    correct_count: int,
    irt_theta: float,
    roadmap_id: str,
    concept_mastery_updates: list of {concept_id, name, mastery, bkt_mastery, forgetting_risk}
  }

Use SQLAlchemy ORM. All operations in a single DB transaction.
```

---

## 17. QUICK REFERENCE: ALL FORMULAS IN ONE PLACE

### Multi-Factor Mastery

```
M = 0.30*Acc + 0.20*DiffPerf + 0.15*RecentAcc + 0.15*Retention + 0.10*Consistency + 0.10*Speed

Confidence = 0.85 * (1 - exp(-N / 5.0)) + 0.15 * (1 - variance)
             clamp to [0.10, 0.98]
```

### Bayesian Knowledge Tracing

```
P(L | correct) = P(L)*(1-S) / [P(L)*(1-S) + (1-P(L))*G]
P(L | wrong)   = P(L)*S    / [P(L)*S    + (1-P(L))*(1-G)]
P(L_next) = P(L|obs) + (1-P(L|obs)) * T
```

### Item Response Theory 3PL

```
P(correct|theta) = c + (1-c) / (1 + exp(-a*(theta - b)))
b = log(difficulty / (1 - difficulty)) * 1.5
Newton-Raphson: delta = sum(a*(u-P)) / sum(a^2 * P * (1-P))
                theta_new = theta + clamp(delta, -0.75, +0.75)
```

### Ebbinghaus Forgetting

```
S = S_base * (1 + 0.5 * review_count)
decay = ln(2) / S
R(t) = exp(-decay * t)
effective_mastery = base_mastery * max(0.35, R(t))
forgetting_risk = max(0.0, 1 - max(0.35, R(t)))
```

### Priority Score

```
Priority = gap*0.35 + exam_weight*0.25 + prereq_impact*0.25 + forgetting_risk*0.08 + (1-confidence)*0.07
```

### Prerequisite Impact

```
impact = 0.4 * min(direct_successors / 3.0, 1.0) + 0.6 * (total_descendants / total_nodes)
clamp to [0.1, 1.0]
```

### Speed Factor

```
ratio = actual_time / expected_time
ratio < 0.2:  0.50
ratio <= 1.0: 1.00
ratio <= 2.0: max(0.60, 1.0 - 0.4*(ratio-1.0))
ratio > 2.0:  max(0.30, 0.60 - 0.15*(ratio-2.0))
```

---

## 18. VERIFICATION AND TESTING CHECKLIST

### BKT Tests

```python
bkt = BayesianKnowledgeTracing(p_init=0.20, p_transit=0.15, p_guess=0.25, p_slip=0.10)

result = bkt.compute_sequence_mastery([True, True, True, True, True])
assert result > 0.80, f"Expected > 0.80 after 5 correct, got {result}"

result = bkt.compute_sequence_mastery([False, False, False, False, False])
assert result < 0.40, f"Expected < 0.40 after 5 wrong, got {result}"

p_after_wrong = bkt.update_single_step(0.20, False)
p_after_right = bkt.update_single_step(p_after_wrong, True)
assert p_after_right > 0.20, "Knowledge should increase after correct answer"
```

### IRT Tests

```python
irt = ItemResponseTheory()

responses = [(True, 0.30, 1.0), (True, 0.30, 1.0), (True, 0.35, 1.0)]
theta = irt.estimate_student_ability(responses)
assert theta > 0.0, f"Expected theta > 0 for easy correct questions, got {theta}"

responses = [(False, 0.80, 1.0), (False, 0.85, 1.0), (False, 0.90, 1.0)]
theta = irt.estimate_student_ability(responses)
assert theta < 0.0, f"Expected theta < 0 for hard wrong questions, got {theta}"
```

### Ebbinghaus Tests

```python
import datetime
fm = ForgettingModel()

result = fm.calculate_retention(0.80, datetime.datetime.utcnow(), review_count=0)
assert result["retention_score"] > 0.98, "Just practiced: retention should be near 1.0"

past = datetime.datetime.utcnow() - datetime.timedelta(days=14)
result = fm.calculate_retention(0.80, past, review_count=0)
assert result["retention_score"] <= 0.50, "14 days later with no review: should be < 50%"
assert result["forgetting_risk"] > 0.50, "Should have high forgetting risk"
```

### DAG Prerequisite Tests

```python
g = nx.DiGraph()
g.add_edge("A", "B")
g.add_edge("B", "C")

ancestors = get_all_prerequisites("C")
assert "A" in ancestors
assert "B" in ancestors

result = analyze_prerequisite_chain(student_id, "C", mastery_threshold=0.60)
assert result["has_prerequisite_gaps"] == True
assert result["recommended_first_concept"] == "A"
```

### Priority Score Tests

```python
p_weak = calculate_priority(concept_high_importance, mastery_record_with_mastery_0)
p_strong = calculate_priority(concept_low_importance, mastery_record_with_mastery_0_9)
assert p_weak["priority_score"] > p_strong["priority_score"]
```

### Roadmap Integration Test

```python
roadmap = generate_roadmap(student_id)
assert roadmap[0]["concept_id"] == broken_prerequisite_id
assert roadmap[0]["priority_score"] == 0.95
assert any("Root foundational gap" in r for r in roadmap[0]["reasons"])
```

---

## CLOSING NOTES FOR THE ENGINEER

This algorithm represents a complete closed-loop learner intelligence system. The five engines are designed to be:

1. Composable: You can use just BKT without IRT. You can use just the forgetting curve without the DAG. Each engine adds value independently.

2. Transparent: Every priority score comes with human-readable reasons. No black box outputs.

3. Offline-capable: No external AI API is needed. All computation is local math.

4. Tunable: Every weight and threshold is a configurable parameter. You do not need to rebuild the system for a new domain. Just change the config.

5. Explainable: A student can ask "Why is this in my roadmap?" and the system can answer precisely, because every roadmap action carries a structured list of reasons derived directly from the math.

The most powerful idea in this entire system is the prerequisite DAG interception: the insight that a student's failure today is often caused by a broken foundation from months ago, and that the correct response is to trace back to that root cause rather than repeating the same advanced content.

This idea is universally applicable. In software training: you cannot teach microservices to someone who does not understand HTTP. In medical training: you cannot teach cardiac pharmacology to someone who does not understand membrane physiology. In sales training: you cannot teach enterprise negotiation to someone who cannot qualify a lead.

The DAG finds the real root cause. The other four engines measure how close the student is to fixing it. Together, they build a roadmap that works.

---

Source: Adaptive Student Intelligence and Dynamic Roadmap Platform v3.0
Source files: backend/app/student_model/, backend/app/roadmap/, backend/app/knowledge_graph/, backend/app/ai/
