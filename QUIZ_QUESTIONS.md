# Adaptive Intelligence Engine — Comprehensive Quiz Question Bank

> **Platform**: CoreShadow Adaptive Student Intelligence & Dynamic Roadmap Engine  
> **Target Examinations**: JEE Main (PCM) & NEET-UG (PCB)  
> **Total Question Bank**: 30 Authentically Adapted PYQ Questions (15 JEE Main + 15 NEET-UG)  
> **Question Origin**: Adapted from official NTA Past Year Papers (2021–2023) with modified numerical parameters and distractor error traps to eliminate rote memorization and assess true conceptual mastery.

---

## Table of Contents

1. [Architecture & Pedagogical Design](#architecture--pedagogical-design)
2. [Question Bank Summary Matrix](#question-bank-summary-matrix)
3. [Part I: JEE Main Question Bank (15 Questions)](#part-i-jee-main-question-bank)
   - [Physics (5 Questions)](#jee-physics)
   - [Chemistry (5 Questions)](#jee-chemistry)
   - [Mathematics (5 Questions)](#jee-mathematics)
4. [Part II: NEET-UG Question Bank (15 Questions)](#part-ii-neet-ug-question-bank)
   - [Biology (5 Questions)](#neet-biology)
   - [Physics (5 Questions)](#neet-physics)
   - [Chemistry (5 Questions)](#neet-chemistry)
5. [Cognitive Distractor Taxonomy](#cognitive-distractor-taxonomy)

---

## Architecture & Pedagogical Design

The question bank is engineered to power a 3-tier adaptive assessment pipeline:
- **Tier 1 — Compulsory Diagnostic Screener (9 Qs)**: 3 questions per subject. Evaluates global baseline ability ($\theta$), Bayesian Knowledge Tracing $P(L)$, and flags weak subjects ($< 60\%$ accuracy).
- **Tier 2 — Targeted Chapter Drills (5 Qs)**: Triggered for flagged weak areas or specific chapters to identify fine-grained prerequisite gaps.
- **Tier 3 — Full-Syllabus Deep Scan (15 Qs)**: Comprehensive 15-question diagnostic across all major curriculum chapters.

Each question is parameterized with:
- **IRT Difficulty ($b \in [0, 1]$)**: Calibrated against item response theory.
- **IRT Discrimination ($a \in [1.0, 2.5]$)**: Steepness of the item response function curve.
- **Estimated Solve Time**: Realistic time budget in seconds.
- **Cognitive Error Classification**: Every distractor option maps to a specific diagnosis (`CONCEPTUAL_ERROR`, `CALCULATION_ERROR`, `FORMULA_SELECTION_ERROR`, `SIGN_ERROR`, etc.).

---

## Question Bank Summary Matrix

| # | Question ID | Exam | Subject | Chapter | Topic | Difficulty | Skill | Correct |
|---|-------------|------|---------|---------|-------|------------|-------|---------|
| 1 | `JEE_2021_PHY_001` | **JEE** | Physics | Electrodynamics & Semiconductors | AC Resonance & Semiconductor Diodes | 40% | conceptual | **B** |
| 2 | `JEE_2021_PHY_002` | **JEE** | Physics | Modern Physics & Waves | Bohr Model & de Broglie Wavelength | 45% | conceptual | **A** |
| 3 | `JEE_2021_PHY_005` | **JEE** | Physics | Mechanics | Center of Mass, Rotation & Gravitation | 72% | application | **D** |
| 4 | `JEE_2021_PHY_007` | **JEE** | Physics | Mechanics | Center of Mass, Rotation & Gravitation | 50% | conceptual | **A** |
| 5 | `JEE_2021_PHY_016` | **JEE** | Physics | Modern Physics & Waves | Bohr Model & de Broglie Wavelength | 55% | application | **B** |
| 6 | `JEE_2021_CHEM_001` | **JEE** | Chemistry | Organic Chemistry | General Organic Chemistry (GOC) | 68% | reasoning | **C** |
| 7 | `JEE_2021_CHEM_006` | **JEE** | Chemistry | Organic Chemistry | General Organic Chemistry (GOC) | 60% | application | **A** |
| 8 | `JEE_2021_CHEM_011` | **JEE** | Chemistry | Physical Chemistry | Chemical Thermodynamics | 57% | conceptual | **B** |
| 9 | `JEE_2021_MATH_002` | **JEE** | Mathematics | Calculus | Limits, Continuity & Differentiability | 78% | application | **B** |
| 10 | `JEE_2021_MATH_006` | **JEE** | Mathematics | Calculus | Limits, Continuity & Differentiability | 62% | application | **D** |
| 11 | `JEE_2021_MATH_010` | **JEE** | Mathematics | Algebra & Vectors | Quadratic Equations | 65% | application | **D** |
| 12 | `JEE_2021_MATH_014` | **JEE** | Mathematics | Calculus | Integral Calculus & Differential Equations | 70% | application | **B** |
| 13 | `JEE_2022_CHEM_EQUIL_001` | **JEE** | Chemistry | Physical Chemistry | Chemical Thermodynamics | 52% | application | **A** |
| 14 | `JEE_2023_CHEM_BUFFER_001` | **JEE** | Chemistry | Physical Chemistry | Ionic Equilibrium | 57% | application | **A** |
| 15 | `JEE_2023_MATH_LIMIT_001` | **JEE** | Mathematics | Calculus | Limits, Continuity & Differentiability | 60% | application | **A** |
| 16 | `NEET_BIO_CELL_001` | **NEET** | Biology | Cell Biology & Genetics | Cell: The Unit of Life | 38% | factual_recall | **A** |
| 17 | `NEET_BIO_MIT_002` | **NEET** | Biology | Cell Biology & Genetics | Cell: The Unit of Life | 62% | application | **A** |
| 18 | `NEET_BIO_GEN_003` | **NEET** | Biology | Cell Biology & Genetics | Principles of Inheritance and Variation | 55% | application | **A** |
| 19 | `NEET_BIO_LINK_004` | **NEET** | Biology | Cell Biology & Genetics | Principles of Inheritance and Variation | 78% | reasoning | **A** |
| 20 | `NEET_BIO_CIRC_005` | **NEET** | Biology | Human Physiology | Body Fluids and Circulation | 45% | factual_recall | **A** |
| 21 | `NEET_BIO_PHYS_006` | **NEET** | Biology | Human Physiology | Body Fluids and Circulation | 52% | application | **A** |
| 22 | `NEET_PHY_OPT_001` | **NEET** | Physics | Optics | Ray Optics & Optical Instruments | 57% | application | **A** |
| 23 | `NEET_PHY_MECH_002` | **NEET** | Physics | Mechanics & Laws of Motion | Kinematics & Work-Energy | 60% | application | **A** |
| 24 | `NEET_PHY_KIN_003` | **NEET** | Physics | Mechanics & Laws of Motion | Kinematics & Work-Energy | 48% | application | **A** |
| 25 | `NEET_CHEM_BIOMOL_001` | **NEET** | Chemistry | Biomolecules & Organic Chemistry | Biomolecules | 42% | conceptual | **A** |
| 26 | `NEET_CHEM_EQUIL_002` | **NEET** | Chemistry | Physical Chemistry & Equilibrium | Ionic Equilibrium & Acids/Bases | 65% | application | **A** |
| 27 | `NEET_CHEM_CARB_003` | **NEET** | Chemistry | Biomolecules & Organic Chemistry | Biomolecules | 50% | conceptual | **A** |
| 28 | `NEET_PHY_OPT_004` | **NEET** | Physics | Optics | Ray Optics & Optical Instruments | 62% | application | **A** |
| 29 | `NEET_PHY_KIN_005` | **NEET** | Physics | Mechanics & Laws of Motion | Kinematics & Work-Energy | 65% | application | **A** |
| 30 | `NEET_CHEM_EQUIL_004` | **NEET** | Chemistry | Physical Chemistry & Equilibrium | Ionic Equilibrium & Acids/Bases | 68% | application | **A** |

---

## Part I: JEE Main Question Bank

### Physics (JEE Main Track)

#### Q1. `JEE_2021_PHY_001` — AC Resonance & Semiconductor Diodes

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Physics** |
| **Chapter** | Electrodynamics & Semiconductors |
| **Concept ID** | `phy_zener_logic_gates` |
| **Target Skill** | `CONCEPTUAL` |
| **IRT Difficulty** | **0.40** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.25` |
| **Estimated Time** | `45 seconds` (~0.8 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
Zener breakdown occurs in a p-n junction diode having p and n regions both :
(1) lightly doped and have wide depletion layer.
(2) heavily doped and have narrow depletion layer.
(3) heavily doped and have wide depletion layer.
(4) lightly doped and have narrow depletion layer.
```

**Options:**
- **(A)** lightly doped and have wide depletion layer.
- **(B)** heavily doped and have narrow depletion layer.
- **(C)** heavily doped and have wide depletion layer.
- **(D)** lightly doped and have narrow depletion layer.

**Correct Answer:** `B`

**Detailed Derivation & Explanation:**
> Zener breakdown occurs in heavily doped p-n junctions due to intense electric field (high tunneling probability) across the extremely narrow depletion region.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **A** | `CONCEPTUAL_ERROR` | Lightly doped diodes with wide depletion layers exhibit Avalanche breakdown, not Zener breakdown. |
| **C** | `CONCEPTUAL_ERROR` | Heavy doping significantly reduces depletion layer width, it cannot be wide. |
| **D** | `CARELESS_ERROR` | Light doping produces a wide depletion layer. |

---

#### Q2. `JEE_2021_PHY_002` — Bohr Model & de Broglie Wavelength

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Physics** |
| **Chapter** | Modern Physics & Waves |
| **Concept ID** | `phy_bohr_transitions` |
| **Target Skill** | `CONCEPTUAL` |
| **IRT Difficulty** | **0.45** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.3` |
| **Estimated Time** | `50 seconds` (~0.8 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
According to the Bohr atom model, in which of the following transitions will the emitted photon frequency be maximum?
(1) n = 2 to n = 1
(2) n = 4 to n = 3
(3) n = 5 to n = 4
(4) n = 3 to n = 2
```

**Options:**
- **(A)** n = 2 to n = 1
- **(B)** n = 4 to n = 3
- **(C)** n = 5 to n = 4
- **(D)** n = 3 to n = 2

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Energy delta E = h*f = 13.6 * (1/n1^2 - 1/n2^2). For n=2 -> n=1: delta E = 13.6 * (1 - 1/4) = 10.2 eV, which is greater than any other adjacent transition in hydrogen.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CALCULATION_ERROR` | Delta E is only 0.66 eV for 4->3. |
| **C** | `CALCULATION_ERROR` | Delta E is 0.31 eV for 5->4. |
| **D** | `CONCEPTUAL_ERROR` | 3->2 transition (Balmer alpha) gives 1.89 eV, much less than Lyman alpha. |

---

#### Q3. `JEE_2021_PHY_005` — Center of Mass, Rotation & Gravitation

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Physics** |
| **Chapter** | Mechanics |
| **Concept ID** | `phy_center_of_mass_cutoff` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.72** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.65` |
| **Estimated Time** | `90 seconds` (~1.5 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `No` |
| **Transfer Question** | `Yes` |

**Problem Statement:**
```text
A circular hole of radius (a/2) is cut out of a circular disc of radius 'a' such that the hole touches the outer edge and the disc center. The centroid of the remaining circular portion with respect to origin 'O' at the left circumference will be :
```

**Options:**
- **(A)** 10/11 a
- **(B)** 2/3 a
- **(C)** 1/6 a
- **(D)** 5/6 a

**Correct Answer:** `D`

**Detailed Derivation & Explanation:**
> Let surface density be sigma. Original disc mass M1 = sigma*pi*a^2 with COM at x1 = a. Removed hole mass M2 = sigma*pi*(a/2)^2 = M1/4 with COM at x2 = 3a/2. Remaining centroid X_com = (M1*a - (M1/4)*(3a/2)) / (M1 - M1/4) = (a - 3a/8) / (3/4) = (5a/8) / (3/4) = 5a/6.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **A** | `CALCULATION_ERROR` | Arithmetic error during subtraction of cut-out mass. |
| **B** | `CONCEPTUAL_ERROR` | Used centroid relative to original center instead of origin O at perimeter. |
| **C** | `SIGN_ERROR` | Shift from original center is a/6, but relative to O at edge it is a - a/6 = 5a/6. |

---

#### Q4. `JEE_2021_PHY_007` — Center of Mass, Rotation & Gravitation

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Physics** |
| **Chapter** | Mechanics |
| **Concept ID** | `phy_shm_oscillations` |
| **Target Skill** | `CONCEPTUAL` |
| **IRT Difficulty** | **0.50** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.35` |
| **Estimated Time** | `60 seconds` (~1.0 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
When a particle executes Simple Harmonic Motion (SHM), the nature of graphical representation of velocity as a function of displacement (v vs x) is :
```

**Options:**
- **(A)** Elliptical
- **(B)** Parabolic
- **(C)** Straight line
- **(D)** Circular

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> In SHM, velocity v = omega*sqrt(A^2 - x^2) => v^2 = omega^2(A^2 - x^2) => v^2/(omega*A)^2 + x^2/A^2 = 1. This represents an ellipse with semi-axes A and omega*A in the (x, v) phase plane.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CONCEPTUAL_ERROR` | Confused with parabolic acceleration-displacement or trajectory equation. |
| **C** | `CONCEPTUAL_ERROR` | Acceleration vs displacement is a straight line a = -omega^2 x, not velocity. |
| **D** | `CONCEPTUAL_ERROR` | Only circular if omega = 1 with identical scale axes; standard representation is elliptical. |

---

#### Q5. `JEE_2021_PHY_016` — Bohr Model & de Broglie Wavelength

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Physics** |
| **Chapter** | Modern Physics & Waves |
| **Concept ID** | `phy_de_broglie_waves` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.55** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.4` |
| **Estimated Time** | `65 seconds` (~1.1 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
The de Broglie wavelength of a proton and an alpha-particle are equal. The ratio of their velocities (v_p : v_alpha) is :
```

**Options:**
- **(A)** 4 : 2
- **(B)** 4 : 1
- **(C)** 1 : 4
- **(D)** 4 : 3

**Correct Answer:** `B`

**Detailed Derivation & Explanation:**
> lambda = h / (m*v). Since lambda_p = lambda_alpha => m_p * v_p = m_alpha * v_alpha => v_p / v_alpha = m_alpha / m_p. Since m_alpha approx 4 * m_p, the ratio of velocities is 4 : 1.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **A** | `CALCULATION_ERROR` | Incomplete simplification of 4/1. |
| **C** | `FORMULA_SELECTION_ERROR` | Inverted the mass-velocity inverse proportionality. |
| **D** | `CARELESS_ERROR` | Used mass of triton instead of alpha particle. |

---

### Chemistry (JEE Main Track)

#### Q6. `JEE_2021_CHEM_001` — General Organic Chemistry (GOC)

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Chemistry** |
| **Chapter** | Organic Chemistry |
| **Concept ID** | `chem_nucleophilic_substitution` |
| **Target Skill** | `REASONING` |
| **IRT Difficulty** | **0.68** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.55` |
| **Estimated Time** | `75 seconds` (~1.2 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `No` |
| **Transfer Question** | `Yes` |

**Problem Statement:**
```text
The correct order of the following compounds showing increasing tendency towards nucleophilic aromatic substitution reaction is :
(i) Chlorobenzene
(ii) 1-Chloro-4-nitrobenzene
(iii) 1-Chloro-2,4-dinitrobenzene
(iv) 1-Chloro-2,4,6-trinitrobenzene (Picryl chloride)
```

**Options:**
- **(A)** (iv) < (i) < (iii) < (ii)
- **(B)** (iv) < (i) < (ii) < (iii)
- **(C)** (i) < (ii) < (iii) < (iv)
- **(D)** (iv) < (iii) < (ii) < (i)

**Correct Answer:** `C`

**Detailed Derivation & Explanation:**
> Nucleophilic aromatic substitution in aryl halides proceeds via addition-elimination (Meisenheimer complex). Strong electron-withdrawing -NO2 groups (-M, -I) at ortho and para positions stabilize the carbanionic intermediate, drastically accelerating substitution: Chlorobenzene < Mono-nitro < Di-nitro < Tri-nitro.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **A** | `CONCEPTUAL_ERROR` | Reversed order for trinitro derivative. |
| **B** | `CARELESS_ERROR` | Incorrect ordering of intermediate dinitro compound. |
| **D** | `SIGN_ERROR` | Inverted the direction of the inequality (descending instead of increasing). |

---

#### Q7. `JEE_2021_CHEM_006` — General Organic Chemistry (GOC)

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Chemistry** |
| **Chapter** | Organic Chemistry |
| **Concept ID** | `chem_electronic_effects` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.60** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.45` |
| **Estimated Time** | `70 seconds` (~1.2 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
Which one of the following carbonyl compounds CANNOT be prepared by addition of water on an alkyne in the presence of HgSO4 and H2SO4 (Kucherov Reaction)?
```

**Options:**
- **(A)** CH3-CH2-CHO (Propanal)
- **(B)** Cyclohexyl methyl ketone
- **(C)** CH3-CHO (Acetaldehyde)
- **(D)** CH3-CO-CH2-CH3 (Butan-2-one)

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Kucherov hydration follows Markovnikov's addition of water across alkynes. Only ethyne (HC#CH) yields an aldehyde (acetaldehyde CH3CHO). All higher terminal and internal alkynes (e.g., propyne) yield ketones (e.g. acetone), never higher aldehydes like propanal.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CONCEPTUAL_ERROR` | Ethynylcyclohexane readily yields cyclohexyl methyl ketone via Markovnikov addition. |
| **C** | `CONCEPTUAL_ERROR` | Acetylene (ethyne) uniquely gives acetaldehyde. |
| **D** | `CONCEPTUAL_ERROR` | But-1-yne or but-2-yne yields butan-2-one. |

---

#### Q8. `JEE_2021_CHEM_011` — Chemical Thermodynamics

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Chemistry** |
| **Chapter** | Physical Chemistry |
| **Concept ID** | `chem_first_law_thermo` |
| **Target Skill** | `CONCEPTUAL` |
| **IRT Difficulty** | **0.58** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.3` |
| **Estimated Time** | `60 seconds` (~1.0 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
The correct set from the following in which both pairs are in the correct order of melting point is :
(1) LiF > LiCl ; NaCl > MgO
(2) LiF > LiCl ; MgO > NaCl
(3) LiCl > LiF ; NaCl > MgO
(4) LiCl > LiF ; MgO > NaCl
```

**Options:**
- **(A)** LiF > LiCl ; NaCl > MgO
- **(B)** LiF > LiCl ; MgO > NaCl
- **(C)** LiCl > LiF ; NaCl > MgO
- **(D)** LiCl > LiF ; MgO > NaCl

**Correct Answer:** `B`

**Detailed Derivation & Explanation:**
> Melting point is directly proportional to Lattice Energy (U approx |q1*q2| / (r+ + r-)). For LiF vs LiCl: F- has smaller ionic radius than Cl-, so Lattice Energy of LiF > LiCl. For MgO vs NaCl: Mg2+ and O2- have charge product 4 vs 1 for Na+ and Cl-, so MgO >> NaCl.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **A** | `CONCEPTUAL_ERROR` | MgO has much higher lattice energy than NaCl due to divalent ions (+2/-2 vs +1/-1). |
| **C** | `CONCEPTUAL_ERROR` | Larger anion Cl- decreases lattice energy in LiCl compared to LiF. |
| **D** | `FORMULA_SELECTION_ERROR` | Reversed both lattice energy trends. |

---

#### Q9. `JEE_2022_CHEM_EQUIL_001` — Chemical Thermodynamics

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Chemistry** |
| **Chapter** | Physical Chemistry |
| **Concept ID** | `chem_chemical_equil_kp_kc` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.52** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.35` |
| **Estimated Time** | `60 seconds` (~1.0 min) |
| **Source PYQ Paper** | `MAIN_2022_JULY25_S1` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[JEE Main 2022 Adapted - Modified Data] For the gaseous equilibrium reaction: N2(g) + 3 H2(g) <=> 2 NH3(g) maintained at 500 K, the numerical ratio of Kp to Kc (in terms of gas constant R and temperature T in Kelvin) is equal to :
```

**Options:**
- **(A)** (RT)^-2
- **(B)** (RT)^2
- **(C)** (RT)^-1
- **(D)** (RT)^1

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> The relationship between Kp and Kc is Kp = Kc * (RT)^(Delta n_g). Here Delta n_g = moles of gaseous products - moles of gaseous reactants = 2 - (1 + 3) = 2 - 4 = -2. Therefore Kp / Kc = (RT)^(-2) = 1 / (RT)^2.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `SIGN_ERROR` | Inverted Delta n_g as +2 (4 - 2 instead of 2 - 4). |
| **C** | `CALCULATION_ERROR` | Used Delta n_g = -1. |
| **D** | `CONCEPTUAL_ERROR` | Miscalculated stoichiometric difference. |

---

#### Q10. `JEE_2023_CHEM_BUFFER_001` — Ionic Equilibrium

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Chemistry** |
| **Chapter** | Physical Chemistry |
| **Concept ID** | `chem_ionic_ph_buffer` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.58** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.4` |
| **Estimated Time** | `65 seconds` (~1.1 min) |
| **Source PYQ Paper** | `MAIN_2023_JAN25_S1` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[JEE Main 2023 Adapted - Modified Data] An acidic buffer solution is prepared by mixing 0.20 M acetic acid (CH3COOH, pKa = 4.74) and 0.02 M sodium acetate (CH3COONa). The calculated pH of this resulting buffer solution is :
```

**Options:**
- **(A)** 3.74
- **(B)** 5.74
- **(C)** 4.74
- **(D)** 2.74

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> According to the Henderson-Hasselbalch equation: pH = pKa + log([Conjugate Base] / [Acid]) = 4.74 + log(0.02 / 0.20) = 4.74 + log(0.10) = 4.74 + (-1.00) = 3.74.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `SIGN_ERROR` | Inverted the ratio log(Acid/Salt) adding 1 instead of subtracting 1. |
| **C** | `CONCEPTUAL_ERROR` | Assumed equimolar buffer where pH = pKa. |
| **D** | `CALCULATION_ERROR` | Subtracted 2 units instead of 1 unit. |

---

### Mathematics (JEE Main Track)

#### Q11. `JEE_2021_MATH_002` — Limits, Continuity & Differentiability

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Mathematics** |
| **Chapter** | Calculus |
| **Concept ID** | `math_differentiability` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.78** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.7` |
| **Estimated Time** | `95 seconds` (~1.6 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `No` |
| **Transfer Question** | `Yes` |

**Problem Statement:**
```text
Let f be a twice differentiable function on R such that f(0) = 1, f'(0) = 2 and f'(x) != 0 for all x in R. If det[[f(x), f'(x)], [f'(x), f''(x)]] = 0 for all x in R, then the value of f(1) lies in the interval :
```

**Options:**
- **(A)** (9, 12)
- **(B)** (6, 9)
- **(C)** (3, 6)
- **(D)** (0, 3)

**Correct Answer:** `B`

**Detailed Derivation & Explanation:**
> det = f(x)*f''(x) - (f'(x))^2 = 0 => (f'(x)/f(x))' = 0 => f'(x)/f(x) = k (constant). At x=0: k = f'(0)/f(0) = 2/1 = 2. Thus f'(x) = 2*f(x) => ln|f(x)| = 2x + C. With f(0)=1 => C=0, so f(x) = e^(2x). Therefore f(1) = e^2 approx 7.389, which lies in (6, 9).

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **A** | `CALCULATION_ERROR` | Overestimated e^2 > 9. |
| **C** | `CALCULATION_ERROR` | Confused e^2 with 2e approx 5.43. |
| **D** | `CARELESS_ERROR` | Assumed f(1) = e approx 2.71. |

---

#### Q12. `JEE_2021_MATH_006` — Limits, Continuity & Differentiability

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Mathematics** |
| **Chapter** | Calculus |
| **Concept ID** | `math_aod_monotonocity` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.62** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.4` |
| **Estimated Time** | `75 seconds` (~1.2 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S2` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
If P is a point on the parabola y = x^2 + 4 which is closest to the straight line y = 4x - 1, then the coordinates of P are :
```

**Options:**
- **(A)** (-2, 8)
- **(B)** (1, 5)
- **(C)** (3, 13)
- **(D)** (2, 8)

**Correct Answer:** `D`

**Detailed Derivation & Explanation:**
> The closest point P on the curve has tangent parallel to the line y = 4x - 1. Slope of line m = 4. Derivative dy/dx = 2x = 4 => x = 2. Then y = (2)^2 + 4 = 8. Hence P is (2, 8).

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **A** | `SIGN_ERROR` | Used dy/dx = -4 giving x = -2. |
| **B** | `CALCULATION_ERROR` | Evaluated slope 2x = 2 => x = 1. |
| **C** | `CARELESS_ERROR` | Tested arbitrary point on curve. |

---

#### Q13. `JEE_2021_MATH_010` — Quadratic Equations

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Mathematics** |
| **Chapter** | Algebra & Vectors |
| **Concept ID** | `math_quadratic_roots` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.65** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.5` |
| **Estimated Time** | `80 seconds` (~1.3 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S1` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
The coefficients a, b and c of the quadratic equation ax^2 + bx + c = 0 are obtained by throwing a fair six-sided die three times. The probability that this equation has equal real roots (discriminant D = 0) is :
```

**Options:**
- **(A)** 1 / 54
- **(B)** 1 / 72
- **(C)** 1 / 36
- **(D)** 5 / 216

**Correct Answer:** `D`

**Detailed Derivation & Explanation:**
> Total sample space = 6^3 = 216. Equal roots => D = b^2 - 4ac = 0 => b^2 = 4ac => ac = b^2/4. For b=2: ac=1 => (a,c) = (1,1) [1 pair]. For b=4: ac=4 => (a,c) = (1,4), (4,1), (2,2) [3 pairs]. For b=6: ac=9 => (a,c) = (3,3) [1 pair]. Total favorable cases = 1 + 3 + 1 = 5. Probability = 5/216.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **A** | `CALCULATION_ERROR` | Counted 4 cases giving 4/216 = 1/54 (missed (3,3)). |
| **B** | `CALCULATION_ERROR` | Counted 3 cases giving 3/216 = 1/72. |
| **C** | `CARELESS_ERROR` | Counted 6 cases giving 6/216 = 1/36. |

---

#### Q14. `JEE_2021_MATH_014` — Integral Calculus & Differential Equations

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Mathematics** |
| **Chapter** | Calculus |
| **Concept ID** | `math_indefinite_integrals` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.70** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.6` |
| **Estimated Time** | `85 seconds` (~1.4 min) |
| **Source PYQ Paper** | `MAIN_2021_FEB24_S1` |
| **Prerequisite Check** | `No` |
| **Transfer Question** | `Yes` |

**Problem Statement:**
```text
If integral [ (cos x - sin x) / sqrt(8 - sin 2x) ] dx = a * arcsin( (sin x + cos x) / b ) + C, where C is a constant of integration, then the ordered pair (a, b) is equal to :
```

**Options:**
- **(A)** (1, -3)
- **(B)** (1, 3)
- **(C)** (-1, 3)
- **(D)** (3, 1)

**Correct Answer:** `B`

**Detailed Derivation & Explanation:**
> Substitute t = sin x + cos x => dt = (cos x - sin x) dx. Also t^2 = 1 + sin 2x => sin 2x = t^2 - 1. Denominator becomes sqrt(8 - (t^2 - 1)) = sqrt(9 - t^2). Integral = int dt/sqrt(3^2 - t^2) = arcsin(t/3) + C = 1 * arcsin((sin x + cos x)/3) + C. Thus a = 1, b = 3.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **A** | `SIGN_ERROR` | Used b = -3 inside arcsin argument. |
| **C** | `SIGN_ERROR` | Added negative sign to integral coefficient. |
| **D** | `CARELESS_ERROR` | Swapped a and b. |

---

#### Q15. `JEE_2023_MATH_LIMIT_001` — Limits, Continuity & Differentiability

| Property | Specification |
|:---|:---|
| **Exam Track** | `JEE` (JEE Main Track) |
| **Subject** | **Mathematics** |
| **Chapter** | Calculus |
| **Concept ID** | `math_limits` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.60** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.45` |
| **Estimated Time** | `60 seconds` (~1.0 min) |
| **Source PYQ Paper** | `MAIN_2023_JAN24_S2` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[JEE Main 2023 Adapted - Modified Data] The value of the limit lim_{x -> 0} [ (1 - cos 4x) / (x * sin 2x) ] is equal to :
```

**Options:**
- **(A)** 4
- **(B)** 2
- **(C)** 8
- **(D)** 1

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Rewrite 1 - cos 4x = 2*sin^2(2x). Then expression = [2*sin^2(2x)] / [x*sin(2x)] = 2 * [sin(2x) / x] = 2 * 2 * [sin(2x)/(2x)]. As x -> 0, sin(2x)/(2x) -> 1, so the limit evaluates to 2 * 2 * 1 = 4.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CALCULATION_ERROR` | Forgot multiplier 2 from sin(2x)/x. |
| **C** | `CALCULATION_ERROR` | Multiplied by extra factor of 2. |
| **D** | `FORMULA_SELECTION_ERROR` | Misapplied standard limit formula. |

---

## Part II: NEET-UG Question Bank

### Biology (NEET-UG Track)

#### Q1. `NEET_BIO_CELL_001` — Cell: The Unit of Life

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Biology** |
| **Chapter** | Cell Biology & Genetics |
| **Concept ID** | `bio_prokaryote_vs_eukaryote` |
| **Target Skill** | `FACTUAL_RECALL` |
| **IRT Difficulty** | **0.38** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.1` |
| **Estimated Time** | `45 seconds` (~0.8 min) |
| **Source PYQ Paper** | `NEET_UG_2021_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG Adapted] Which of the following structures is present in prokaryotes but lacks membrane-bound compartmentalization?
```

**Options:**
- **(A)** Mesosome and 70S Ribosomes
- **(B)** Golgi complex
- **(C)** 80S Ribosomes in cytoplasm
- **(D)** Mitochondria with cristae

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Prokaryotic cells possess 70S ribosomes and infoldings of plasma membrane called mesosomes, but lack membrane-bound organelles such as Golgi, ER, and mitochondria.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CONCEPTUAL_ERROR` | Golgi is exclusively eukaryotic. |
| **C** | `CARELESS_ERROR` | Prokaryotes possess 70S, not 80S ribosomes. |
| **D** | `CONCEPTUAL_ERROR` | Mitochondria are membrane-bound eukaryotic organelles. |

---

#### Q2. `NEET_BIO_MIT_002` — Cell: The Unit of Life

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Biology** |
| **Chapter** | Cell Biology & Genetics |
| **Concept ID** | `bio_cell_cycle_mitosis_meiosis` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.62** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.5` |
| **Estimated Time** | `50 seconds` (~0.8 min) |
| **Source PYQ Paper** | `NEET_UG_2022_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG Adapted] During which sub-stage of Prophase I of Meiosis does crossing over between non-sister chromatids of homologous chromosomes take place?
```

**Options:**
- **(A)** Pachytene (mediated by recombinase enzyme)
- **(B)** Zygotene
- **(C)** Diplotene
- **(D)** Leptotene

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Crossing over occurs during Pachytene stage, mediated by the enzyme recombinase.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CONCEPTUAL_ERROR` | Zygotene is the stage of synapsis. |
| **C** | `CONCEPTUAL_ERROR` | Diplotene is dissolution of synaptonemal complex leaving chiasmata. |
| **D** | `CARELESS_ERROR` | Leptotene is initial condensation. |

---

#### Q3. `NEET_BIO_GEN_003` — Principles of Inheritance and Variation

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Biology** |
| **Chapter** | Cell Biology & Genetics |
| **Concept ID** | `bio_mendelian_laws` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.55** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.3` |
| **Estimated Time** | `60 seconds` (~1.0 min) |
| **Source PYQ Paper** | `NEET_UG_2023_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG Adapted] A heterozygous tall pea plant with violet flowers (TtVv) is test crossed with a dwarf white plant (ttvv). What proportion of progeny will be dwarf with violet flowers assuming independent assortment?
```

**Options:**
- **(A)** 25% (1/4)
- **(B)** 50% (1/2)
- **(C)** 12.5% (1/8)
- **(D)** 6.25% (1/16)

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Test cross of dihybrid TtVv x ttvv yields equal phenotypic ratio of 1:1:1:1. Hence Dwarf with Violet flowers is 1/4 or 25%.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CALCULATION_ERROR` | Multiplied only single trait ratio. |
| **C** | `CARELESS_ERROR` | Confused with trihybrid test cross. |
| **D** | `FORMULA_SELECTION_ERROR` | Used 1/16 from F2 selfing ratio. |

---

#### Q4. `NEET_BIO_LINK_004` — Principles of Inheritance and Variation

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Biology** |
| **Chapter** | Cell Biology & Genetics |
| **Concept ID** | `bio_dihybrid_linkage` |
| **Target Skill** | `REASONING` |
| **IRT Difficulty** | **0.78** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.7` |
| **Estimated Time** | `75 seconds` (~1.2 min) |
| **Source PYQ Paper** | `NEET_UG_2021_ADAPTED` |
| **Prerequisite Check** | `No` |
| **Transfer Question** | `Yes` |

**Problem Statement:**
```text
[NEET-UG Adapted] In Morgan's experiments with Drosophila, cross A (yellow body, white eyes) showed 1.3% recombination, while cross B (white eye, miniature wing) showed 37.2% recombination. What conclusion follows regarding the genes?
```

**Options:**
- **(A)** Body color and eye color genes are tightly linked (physically closer on the X-chromosome)
- **(B)** Eye color and wing size genes are located on different autosomes
- **(C)** Recombination frequency is inversely proportional to physical distance between genes
- **(D)** Cross A exhibits complete absence of linkage

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> A lower recombination frequency (1.3%) indicates very tight linkage (closer physical proximity) on the X chromosome.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CONCEPTUAL_ERROR` | Both genes are on X chromosome. |
| **C** | `CONCEPTUAL_ERROR` | Recombination frequency is directly proportional to distance. |
| **D** | `CARELESS_ERROR` | 1.3% recombinant means 98.7% parental, proving strong linkage. |

---

#### Q5. `NEET_BIO_CIRC_005` — Body Fluids and Circulation

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Biology** |
| **Chapter** | Human Physiology |
| **Concept ID** | `bio_blood_cardiac_cycle` |
| **Target Skill** | `FACTUAL_RECALL` |
| **IRT Difficulty** | **0.45** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.2` |
| **Estimated Time** | `45 seconds` (~0.8 min) |
| **Source PYQ Paper** | `NEET_UG_2022_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG Adapted] In a standard Electrocardiogram (ECG), which wave represents the depolarization of ventricles leading to ventricular contraction?
```

**Options:**
- **(A)** QRS complex
- **(B)** P-wave
- **(C)** T-wave
- **(D)** End of T-wave

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> P-wave represents atrial depolarization; QRS complex represents depolarization of the ventricles initiating ventricular contraction; T-wave represents ventricular repolarization.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CONCEPTUAL_ERROR` | P-wave is atrial depolarization. |
| **C** | `CONCEPTUAL_ERROR` | T-wave represents ventricular repolarization (recovery). |
| **D** | `CARELESS_ERROR` | End of T-wave marks end of ventricular systole. |

---

#### Q6. `NEET_BIO_PHYS_006` — Body Fluids and Circulation

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Biology** |
| **Chapter** | Human Physiology |
| **Concept ID** | `bio_blood_cardiac_cycle` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.52** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.35` |
| **Estimated Time** | `50 seconds` (~0.8 min) |
| **Source PYQ Paper** | `NEET_UG_2021_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG 2021 Adapted - Modified Data] A healthy human adult has a resting heart rate of 72 beats per minute. If the End-Diastolic Volume is 125 mL and End-Systolic Volume is 50 mL, the calculated cardiac output of this individual is :
```

**Options:**
- **(A)** 5.40 L/min
- **(B)** 7.20 L/min
- **(C)** 3.60 L/min
- **(D)** 9.00 L/min

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Stroke volume SV = End-Diastolic Volume - End-Systolic Volume = 125 mL - 50 mL = 75 mL. Cardiac Output = Heart Rate x Stroke Volume = 72 bpm x 75 mL = 5400 mL/min = 5.40 L/min.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CALCULATION_ERROR` | Multiplied 72 by 100 mL without subtracting End-Systolic Volume. |
| **C** | `FORMULA_SELECTION_ERROR` | Multiplied Heart rate by End-Systolic Volume (72 x 50 = 3600 mL). |
| **D** | `CALCULATION_ERROR` | Added End-Diastolic and End-Systolic volumes. |

---

### Physics (NEET-UG Track)

#### Q7. `NEET_PHY_OPT_001` — Ray Optics & Optical Instruments

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Physics** |
| **Chapter** | Optics |
| **Concept ID** | `phy_refraction_tir` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.58** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.4` |
| **Estimated Time** | `60 seconds` (~1.0 min) |
| **Source PYQ Paper** | `NEET_UG_2022_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG 2022 Adapted - Modified Data] A monochromatic light beam travels from glass of refractive index 1.50 (3/2) into water of refractive index 1.33 (4/3). The critical angle of incidence for total internal reflection at this interface is :
```

**Options:**
- **(A)** arcsin(8/9)
- **(B)** arcsin(3/4)
- **(C)** arcsin(2/3)
- **(D)** arcsin(9/8)

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> For total internal reflection from denser medium 1 to rarer medium 2: sin(C) = mu_rarer / mu_denser = (4/3) / (3/2) = (4/3) * (2/3) = 8/9. Hence critical angle C = arcsin(8/9).

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `FORMULA_SELECTION_ERROR` | Assumed medium 1 is air with refractive index 1. |
| **C** | `CALCULATION_ERROR` | Multiplied fractions incorrectly. |
| **D** | `CONCEPTUAL_ERROR` | Sin of an angle cannot exceed 1; inverted the ratio. |

---

#### Q8. `NEET_PHY_MECH_002` — Kinematics & Work-Energy

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Physics** |
| **Chapter** | Mechanics & Laws of Motion |
| **Concept ID** | `phy_work_energy_power_neet` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.60** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.45` |
| **Estimated Time** | `65 seconds` (~1.1 min) |
| **Source PYQ Paper** | `NEET_UG_2023_ADAPTED` |
| **Prerequisite Check** | `No` |
| **Transfer Question** | `Yes` |

**Problem Statement:**
```text
[NEET-UG 2023 Adapted - Modified Data] A small stone of mass 0.4 kg is launched vertically upwards with an initial kinetic energy of 80 J. Neglecting air resistance and taking g = 10 m/s^2, the kinetic energy of the stone when it reaches half of its maximum height will be :
```

**Options:**
- **(A)** 40 J
- **(B)** 20 J
- **(C)** 60 J
- **(D)** 80 J

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> By conservation of mechanical energy: Total Energy E = KE_initial = 80 J. At maximum height H, KE = 0 and PE = mgH = 80 J. At half maximum height (H/2), PE = mg(H/2) = 40 J. Therefore KE = Total Energy - PE = 80 - 40 = 40 J.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CALCULATION_ERROR` | Subtracted 3/4th of energy instead of 1/2. |
| **C** | `CALCULATION_ERROR` | Arithmetic error during energy conservation. |
| **D** | `CONCEPTUAL_ERROR` | Failed to account for gravitational potential energy gain. |

---

#### Q9. `NEET_PHY_KIN_003` — Kinematics & Work-Energy

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Physics** |
| **Chapter** | Mechanics & Laws of Motion |
| **Concept ID** | `phy_kinematics_1d_2d` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.48** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.3` |
| **Estimated Time** | `55 seconds` (~0.9 min) |
| **Source PYQ Paper** | `NEET_UG_2021_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG 2021 Adapted - Modified Data] A sports car moving with an initial speed of 30 m/s is brought to a stop with uniform deceleration over a straight braking distance of 45 m. The magnitude of its deceleration is :
```

**Options:**
- **(A)** 10 m/s^2
- **(B)** 5 m/s^2
- **(C)** 15 m/s^2
- **(D)** 20 m/s^2

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Using third equation of motion: v^2 = u^2 - 2*a*s. With final velocity v = 0, initial velocity u = 30 m/s, and distance s = 45 m: 0 = 30^2 - 2*a*45 => 90*a = 900 => a = 10 m/s^2.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CALCULATION_ERROR` | Computed a = u / (2s) = 30 / 90. |
| **C** | `CARELESS_ERROR` | Used incorrect kinematic equation. |
| **D** | `SIGN_ERROR` | Doubled the deceleration magnitude. |

---

#### Q10. `NEET_PHY_OPT_004` — Ray Optics & Optical Instruments

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Physics** |
| **Chapter** | Optics |
| **Concept ID** | `phy_refraction_tir` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.62** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.4` |
| **Estimated Time** | `60 seconds` (~1.0 min) |
| **Source PYQ Paper** | `NEET_UG_2022_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG 2022 Adapted - Modified Data] An equilateral glass prism has an angle of prism A = 60 deg. If the refractive index of the glass material is mu = sqrt(3), then the angle of minimum deviation (Dm) produced by this prism is :
```

**Options:**
- **(A)** 60 deg
- **(B)** 30 deg
- **(C)** 45 deg
- **(D)** 90 deg

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> From the prism formula: mu = sin((A + Dm)/2) / sin(A/2). With A = 60 deg, sin(A/2) = sin(30 deg) = 1/2. Thus sqrt(3) = sin((60 + Dm)/2) / (1/2) => sin((60 + Dm)/2) = sqrt(3)/2. Therefore (60 + Dm)/2 = 60 deg => 60 + Dm = 120 deg => Dm = 60 deg.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CALCULATION_ERROR` | Confused (60 + Dm)/2 with Dm itself. |
| **C** | `CARELESS_ERROR` | Assumed Dm = 45 deg from standard glass index 1.5. |
| **D** | `SIGN_ERROR` | Added angle of prism twice. |

---

#### Q11. `NEET_PHY_KIN_005` — Kinematics & Work-Energy

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Physics** |
| **Chapter** | Mechanics & Laws of Motion |
| **Concept ID** | `phy_work_energy_power_neet` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.65** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.45` |
| **Estimated Time** | `65 seconds` (~1.1 min) |
| **Source PYQ Paper** | `NEET_UG_2023_ADAPTED` |
| **Prerequisite Check** | `No` |
| **Transfer Question** | `Yes` |

**Problem Statement:**
```text
[NEET-UG 2023 Adapted - Modified Data] A variable force F = (3*x^2 + 2*x) N acts on a particle moving along the x-axis. The total work done by this force in displacing the particle from position x = 0 to x = 2 m is :
```

**Options:**
- **(A)** 12 J
- **(B)** 16 J
- **(C)** 8 J
- **(D)** 24 J

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Work done W = integral_{0}^{2} F dx = integral_{0}^{2} (3*x^2 + 2*x) dx = [x^3 + x^2]_{0}^{2} = (2^3 + 2^2) - 0 = 8 + 4 = 12 J.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CALCULATION_ERROR` | Evaluated 3*(2^2) + 2*(2) = 12 + 4 = 16 (plugged into force instead of integrating). |
| **C** | `CALCULATION_ERROR` | Integrated only the first term (2^3 = 8 J). |
| **D** | `SIGN_ERROR` | Doubled the integral value. |

---

### Chemistry (NEET-UG Track)

#### Q12. `NEET_CHEM_BIOMOL_001` — Biomolecules

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Chemistry** |
| **Chapter** | Biomolecules & Organic Chemistry |
| **Concept ID** | `chem_carbohydrates_proteins` |
| **Target Skill** | `CONCEPTUAL` |
| **IRT Difficulty** | **0.42** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.25` |
| **Estimated Time** | `45 seconds` (~0.8 min) |
| **Source PYQ Paper** | `NEET_UG_2022_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG 2022 Adapted - Modified Data] A straight-chain oligopeptide molecule is synthesized by the sequential condensation of 10 amino acid residues. How many peptide linkages (-CO-NH-) are present in this unbranched peptide chain?
```

**Options:**
- **(A)** 9
- **(B)** 10
- **(C)** 8
- **(D)** 11

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> In an unbranched peptide formed from n amino acid residues, condensation eliminates (n - 1) water molecules, forming (n - 1) peptide bonds. For 10 amino acids: 10 - 1 = 9 peptide linkages.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CONCEPTUAL_ERROR` | Assumed cyclic peptide or 1 bond per amino acid. |
| **C** | `CALCULATION_ERROR` | Subtracted 2 instead of 1. |
| **D** | `SIGN_ERROR` | Added 1 instead of subtracting. |

---

#### Q13. `NEET_CHEM_EQUIL_002` — Ionic Equilibrium & Acids/Bases

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Chemistry** |
| **Chapter** | Physical Chemistry & Equilibrium |
| **Concept ID** | `chem_ionic_ph_buffer_neet` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.65** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.5` |
| **Estimated Time** | `70 seconds` (~1.2 min) |
| **Source PYQ Paper** | `NEET_UG_2023_ADAPTED` |
| **Prerequisite Check** | `No` |
| **Transfer Question** | `Yes` |

**Problem Statement:**
```text
[NEET-UG 2023 Adapted - Modified Data] What is the pH of a 0.01 M (10^-2 M) aqueous solution of a monobasic weak acid HA having an acid dissociation constant Ka = 1.0 x 10^-6 at 298 K?
```

**Options:**
- **(A)** 4.0
- **(B)** 3.0
- **(C)** 5.0
- **(D)** 2.0

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> For a weak monobasic acid where degree of dissociation alpha << 1: [H+] = sqrt(Ka * C) = sqrt(10^-6 * 10^-2) = sqrt(10^-8) = 10^-4 M. Therefore pH = -log[H+] = -log(10^-4) = 4.0.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CALCULATION_ERROR` | Took [H+] = sqrt(Ka) without factoring in concentration C. |
| **C** | `FORMULA_SELECTION_ERROR` | Miscalculated exponent in square root (used 10^-10 instead of 10^-8). |
| **D** | `CONCEPTUAL_ERROR` | Assumed strong acid complete dissociation pH = -log(0.01) = 2. |

---

#### Q14. `NEET_CHEM_CARB_003` — Biomolecules

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Chemistry** |
| **Chapter** | Biomolecules & Organic Chemistry |
| **Concept ID** | `chem_carbohydrates_proteins` |
| **Target Skill** | `CONCEPTUAL` |
| **IRT Difficulty** | **0.50** (🔵 Medium) |
| **IRT Discrimination ($a$)** | `1.3` |
| **Estimated Time** | `50 seconds` (~0.8 min) |
| **Source PYQ Paper** | `NEET_UG_2021_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG 2021 Adapted] Which of the following disaccharides is classified as a non-reducing sugar due to the involvement of the reducing groups of both monosaccharide units in the glycosidic bond?
```

**Options:**
- **(A)** Sucrose (alpha-D-glucopyranosyl beta-D-fructofuranoside)
- **(B)** Maltose (alpha-1,4-glucosidic bond)
- **(C)** Lactose (beta-1,4-galactosidic bond)
- **(D)** Cellobiose (beta-1,4-glucosidic bond)

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> In sucrose, the glycosidic linkage is formed between C1 of alpha-glucose and C2 of beta-fructose. Since both reducing groups (hemiacetal and hemiketal) are tied in the linkage, sucrose does not reduce Fehling's or Tollens' reagents and is a non-reducing sugar.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CONCEPTUAL_ERROR` | Maltose has a free hemiacetal group at C1 of the second glucose unit. |
| **C** | `CONCEPTUAL_ERROR` | Lactose has a free hemiacetal OH group at C1 of glucose. |
| **D** | `CARELESS_ERROR` | Cellobiose is a reducing disaccharide. |

---

#### Q15. `NEET_CHEM_EQUIL_004` — Ionic Equilibrium & Acids/Bases

| Property | Specification |
|:---|:---|
| **Exam Track** | `NEET` (NEET-UG Track) |
| **Subject** | **Chemistry** |
| **Chapter** | Physical Chemistry & Equilibrium |
| **Concept ID** | `chem_ionic_ph_buffer_neet` |
| **Target Skill** | `APPLICATION` |
| **IRT Difficulty** | **0.68** (🟡 Hard) |
| **IRT Discrimination ($a$)** | `1.55` |
| **Estimated Time** | `70 seconds` (~1.2 min) |
| **Source PYQ Paper** | `NEET_UG_2021_ADAPTED` |
| **Prerequisite Check** | `Yes` |
| **Transfer Question** | `No` |

**Problem Statement:**
```text
[NEET-UG 2021 Adapted - Modified Data] The solubility product (Ksp) of silver chloride (AgCl) in water is 1.6 x 10^-10 at 298 K. The molar solubility of AgCl in a 0.10 M aqueous sodium chloride (NaCl) solution is :
```

**Options:**
- **(A)** 1.6 x 10^-9 M
- **(B)** 1.26 x 10^-5 M
- **(C)** 1.6 x 10^-11 M
- **(D)** 1.6 x 10^-8 M

**Correct Answer:** `A`

**Detailed Derivation & Explanation:**
> Due to common ion effect from 0.10 M NaCl: [Cl-] approx 0.10 M. Since Ksp = [Ag+] * [Cl-] => [Ag+] = Ksp / [Cl-] = (1.6 x 10^-10) / 0.10 = 1.6 x 10^-9 M.

**Distractor & Cognitive Error Analysis:**
| Option | Diagnostic Error Trap | Detailed Diagnostic Assessment |
|:---:|:---|:---|
| **B** | `CONCEPTUAL_ERROR` | Calculated pure water solubility sqrt(Ksp) = sqrt(1.6 x 10^-10) approx 1.26 x 10^-5 M ignoring common ion effect. |
| **C** | `CALCULATION_ERROR` | Multiplied by 0.1 instead of dividing. |
| **D** | `CALCULATION_ERROR` | Exponent arithmetic error. |

---

## Cognitive Distractor Taxonomy

The Adaptive Engine categorizes every student error into explicit diagnostic buckets:

| Error Type | Description | Remediation Protocol |
|:---|:---|:---|
| `CONCEPTUAL_ERROR` | Flawed physical, chemical, or biological premise (e.g. confusing Zener vs Avalanche breakdown). | Reroutes student to foundation video & prerequisite theory nodes. |
| `CALCULATION_ERROR` | Correct formula selected, but arithmetic or algebraic execution failed. | Prescribes speed & precision calculation drills. |
| `FORMULA_SELECTION_ERROR` | Selected an invalid equation (e.g. using ideal gas law outside valid regime). | Reinforces boundary conditions and derivation flashcards. |
| `SIGN_ERROR` | Omitted negative sign, thermodynamic convention, or Cartesian sign convention. | Flagged in report card; triggers sign convention refresher. |
| `CARELESS_ERROR` | Misread question prompt (e.g. 'is NOT true', radius vs diameter, unit conversion). | Emphasizes reading discipline during timed screener. |
| `GRAPHICAL_INTERPRETATION_ERROR` | Misidentified axis intercepts, slopes, or peak coordinates on graphical PYQs. | Launches visual coordinate & curve drill. |

---
*Document auto-generated from `data/questions/jee_questions.json` and `data/questions/neet_questions.json` for the Adaptive Intelligence Engine.*