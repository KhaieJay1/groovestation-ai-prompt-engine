# GROOVESTATION PRO: MUSIC INTELLIGENCE SPECIFICATION
*(Implementation-Ready Infrastructure Brief)*

# PART 1 — TECHNICAL TASK LIST

## 1. BACKEND CORE (LOGIC LAYER)

### 1.1 Sound Lock Engine
**Purpose:** Enforce musical consistency.
**Tasks:**
*   Create `SoundLockProfile` schema: `genre`, `bpm_range`, `instruments`, `forbidden_terms`.
*   Store profiles as JSON.
*   Lock profile per channel instance.

### 1.2 Prompt Builder Engine
**Purpose:** Remove free-text prompting.
**Tasks:**
*   Build structured prompt assembler (Fixed order).
*   Inject Sound Lock constraints automatically.
*   Generate negative prompt block.

### 1.3 Prompt Mutation Controller
**Purpose:** Allow variation without drift.
**Tasks:**
*   Define mutable fields (Texture, Density).
*   Hard-lock genre, BPM, energy.

### 1.4 MMQ (Minimum Monetization Quality) Validator
**Purpose:** Gate bad music.
**Tasks:**
*   Build MMQ scoring module (Consistency %, Tempo compliance).
*   Set pass threshold (e.g. 90%).
*   Block rendering pipeline on FAIL.

### 1.5 Tier Access Controller
**Purpose:** Enforce operator quality.
**Tasks:**
*   Define tiers: CORE, ADVANCED, PRO.
*   Gate: Prompt editing, Batch size, Profile creation.

---

## 2. API / SERVICE LAYER
*   `POST /soundlock/create`
*   `GET /soundlock/active`
*   `POST /prompt/generate`
*   `POST /mmq/validate`

---

## 3. UI TASKS (LOCAL DASHBOARD)
### 3.1 Sound Lock Setup Screen
*   Dropdown-only genre selection.
*   BPM slider (locked ranges).

### 3.2 Prompt Generation Screen
*   “Generate Track” button only (No editable text).
*   MMQ status indicator.

### 3.3 MMQ Feedback Panel
*   PASS / FAIL badge with reason.

---

# PART 2 — MASTER INSTRUCTION FOR AI AGENT
> You are building a constraint-driven music production system for GrooveStation Pro.
> Your primary goal is to **enforce consistency, prevent low-quality output, and protect monetization viability**.
> You must:
> * Eliminate free-text prompting
> * Enforce Sound Lock Profiles
> * Block rendering if Minimum Monetization Quality (MMQ) fails
> * Gate advanced control behind tier permissions

---

# PART 3 — EXACT ONBOARDING SCREENS & FLOW
1.  **EXPECTATION GATE**: “Consistency beats creativity”.
2.  **SOUND LOCK SELECTION**: No custom option here.
3.  **VALIDATION GENERATION**: Rejects random music.
4.  **COMMITMENT CONFIRMATION**: “I commit to this sound identity”.

---

# PART 4 — PRICING LOGIC TIED TO ACCESS
*   **Tier A (Core)**: Prevent failure. Locked.
*   **Tier B (Advanced)**: Scale safely.
*   **Tier C (Pro)**: Power users.
**Key Rule**: Users pay for **how much damage they are allowed to do**.

---
*Stored for technical execution.*
