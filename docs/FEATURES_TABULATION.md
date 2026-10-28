# BUSSGROOVE HQ: UNIFIED FEATURE TABULATION
**Objective**: Consolidate all prototype features (Analyzer, Production, Database) into a single Enterprise-Grade Workstation.

## 1. CORE MODULES (CURRENT VS PROTOTYPE)

| Feature Module | Status | Description | User Workflow |
| :--- | :--- | :--- | :--- |
| **Production Factory** | ✅ **Active** | Bulk Video Generation from MP3s. | Drop MP3s -> Click Launch -> Get Videos. |
| **Sound Lock Engine** | ✅ **Active** | Enforces Genre/Sonic Consistency. | Select "Jazz Lofi" -> Engine Restricts Output. |
| **Manual MMQ Gate** | ✅ **Active** | Quality Assurance Checkpoint. | User Certification Checkbox before Render. |
| **Audio Analyzer** | ❌ **Missing** | Drag Ref Track -> Get AI Prompt. | Drag MP3 -> AI Analysis -> Copy Prompt. |
| **Database UI** | ❌ **Missing** | Visual Editor for Playlists/Assets. | Edit Song Metadata Grid (Excel Replacement). |
| **Station HQ** | 🟡 **Partial** | Dashboard Landing Page. | Current "Vibe Tiles" Dashboard. |

---

## 2. ENTERPRISE USABILITY FEATURES (REQUIRED)
*Features that solve "Workflow Problems" at scale.*

### A. Asset Management Logic
*   **Problem**: Users forget background images or provide wrong formats.
*   **Solution**: **Asset Locker**.
    *   Enforce "1 Background per Genre" in the Sound Lock.
    *   If missing, System *prompts* upload or uses Default.
    *   *Auto-Convert* images to 1920x1080.

### B. The "Reverse Engineering" Workflow (Analyzer)
*   **Problem**: User doesn't know what prompt to use for Suno.
*   **Solution**: **Analyzer Tab**.
    *   User drags "Reference Track" (Youtube/MP3).
    *   System output: "This is Lofi Jazz, 85 BPM, Key C Minor".
    *   Action: "Create Sound Lock from this Reference".

### C. Tiered Workspace Isolation
*   **Problem**: Mixing clients (BussGroove vs Safari Lounge).
*   **Solution**: **Brand Context Switching**.
    *   Dropdown at top right: "Select Brand".
    *   Switches `sound_locks.json` and `output` folders entirely.

---

## 3. IMPLEMENTATION PRIORITY

### Priority 1: Integrate "The Analyzer"
*   **Goal**: Rebuild the Streamlit prototype logic inside the Flask App.
*   **Tech**: use `librosa` or similar (if Python) or external API.
*   **UI**: Add "Analyzer" Tab to `index.html`.

### Priority 2: Database UI
*   **Goal**: Stop using Excel/CSV manually.
*   **Tech**: Add "Library" Tab. Grid View of `Music_Songs` folder.
*   **Action**: Edit Metadata, Rename, Delete directly in App.

### Priority 3: Asset Enforcer
*   **Goal**: Prevent "Missing Asset" errors.
*   **Tech**: On Ingest, check for `Image_Assets/{Genre}`. If empty, force Upload dialog.

---

## 4. WORKFLOW DIAGRAM (TARGET STATE)

1.  **Analyzer Tab**: Drag Reference -> Get "Jazz Lofi" definition.
2.  **Station HQ**: Create/Select "Jazz Lofi" Sound Lock.
3.  **Ingest**: Drop Suno Songs. System checks Assets.
4.  **Production**: Batch Render (checked by MMQ).
5.  **Library**: Manage/Delete old files.

---
*Generated for Architectural Alignment.*
