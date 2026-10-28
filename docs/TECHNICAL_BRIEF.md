# 📋 BussGroove Technical Brief & Specification
*Version: Final Release 1.0 (2026-01-25)*

## 1. System Overview
The **BussGroove Video Generator** is an automated pipeline that produces 4K-ready visualizer videos with a specific, branded aesthetic. It integrates audio processing, image generation, and video rendering into a single workflow.

## 2. Visual Identity & Typography
The system enforces a strict "BussGroove" brand style across all outputs (Video & Thumbnail).

### A. Font Standard
*   **Primary Font**: **Arial Bold** (System Default: `arialbd.ttf`).
*   **Why**: Selected for its clean, high-impact readability and premium "no-nonsense" aesthetic.
*   **Uniformity**: Used for Intro, Center Titles, and Corner Branding.

### B. Text Hierarchy (Video Output)
| Element | Content | Color | Size | Case | Position | Timing |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Intro Text** | "BUSSGROOVE PRESENTS" etc. | White/Gold | `80` | CAPS | Center | 0-38s |
| **Center Title** | Genre Name (e.g. "SUNDAY MORNING") | **White** | `80` | **CAPS** | Center | Permanent (40s+) |
| **Subtitle** | Line 2 (Designer Configurable) | **Gold** | `20` | CAPS | **x=1300, y=930** | Permanent (40s+) |
| **Brand** | "BussGroove" | **White** | `70` | Camel | **x=1300, y=950** | Permanent (40s+) |

*Note: The Subtitle (Gold) sits exactly 20px above the Brand text for a tight, cohesive lockup.*

## 3. Intro Sequence Timeline
Total Duration: **40 Seconds** (Cinematic Pace).
1.  **00-07s**: "BUSSGROOVE PRESENTS" (White) overhead.
2.  **10-17s**: "MUSIC IS HERE FOR YOU" (White).
3.  **21-38s**: "LIKE | COMMENT | SUBSCRIBE" (Gold).
4.  **40s+**: Main Title Fade In (Center White + Corner Gold/White).

## 4. Component Logic
*   **Center Title**: **Locked** to System Genre Name. Immutable. Use for High-Level Categorization.
*   **Subtitle (Gold)**: **Flexible**. Linked to "Line 2" input in the Designer. Use for "Good Time Celebration Energy" or Volume Numbers. Font size reduced to `20` to accommodate long strings.

## 5. File Structure
*   `orchestrator.py`: Main logic. Decouples "Line 2" from "Center Title".
*   `video_generator.py`: FFmpeg rendering engine. Hardcoded timings and coordinates.
*   `thumbnail_generator.py`: Thumbnail preview tool. Defaults to "BussGroove Style (Arial)".
*   `templates/index.html`: Web Interface for the Workspace.

## 6. Usage
Run the following command to start the full production server:
```powershell
python app.py
```
Or standalone video generation (CLI):
```powershell
python orchestrator.py
```

*Signed off by Antigravity Agent.*
