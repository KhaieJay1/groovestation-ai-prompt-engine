import streamlit as st
import os
import glob
import subprocess
import time
import json
from datetime import datetime
from audio_processor import analyze_track
from prompt_generator import generate_style_prompt

# Setup - Database in accessible Desktop location
DATABASE_DIR = os.path.expanduser("~/Desktop/BussGroove/Database")
DOWNLOADS_DIR = os.path.join(DATABASE_DIR, "downloads")
UPLOAD_DIR = os.path.join(DATABASE_DIR, "uploads")
PROMPTS_DB_PATH = os.path.join(DATABASE_DIR, "prompts.json")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DOWNLOADS_DIR, exist_ok=True)


def save_prompt_to_database(prompt_data, results, catalog):
    """Save generated prompt to prompts.json database."""
    try:
        # Load existing prompts
        if os.path.exists(PROMPTS_DB_PATH):
            with open(PROMPTS_DB_PATH, 'r', encoding='utf-8') as f:
                prompts = json.load(f)
        else:
            prompts = []
        
        # Generate next ID
        existing_ids = [int(p.get('prompt_id', 'PROMPT_000').replace('PROMPT_', '')) for p in prompts if 'prompt_id' in p]
        next_id = max(existing_ids, default=0) + 1
        
        # Create new prompt entry
        new_prompt = {
            "prompt_id": f"PROMPT_{next_id:03d}",
            "style_id": f"STYLE_AUTO_{catalog.replace(' ', '_').upper()}",
            "prompt_name": f"{catalog} Analysis - {datetime.now().strftime('%H:%M')}",
            "full_prompt_text": prompt_data.get('style_prompt', ''),
            "tempo_bpm": results.get('bpm', 0),
            "structure": prompt_data.get('structure_template', ''),
            "purpose": "Production",
            "target_platforms": "YouTube, Spotify",
            "status": "Draft",
            "performance_rating": 0,
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_used_date": datetime.now().strftime("%Y-%m-%d"),
            "times_used": 0,
            "notes": f"Auto-generated from reference track. Key: {results.get('key', 'Unknown')}, Energy: {results.get('energy', 0)}/10"
        }
        
        prompts.append(new_prompt)
        
        # Save back to database
        with open(PROMPTS_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(prompts, f, indent=4, ensure_ascii=False)
        
        return new_prompt['prompt_id'], len(prompts)
    except Exception as e:
        return None, str(e)


st.set_page_config(page_title="BussGroove Analyzer", layout="wide", page_icon="🎹")

# Styling with Navigation Bar
st.markdown("""
<style>
    .stButton>button { width: 100%; border-radius: 8px; }
    .header-title { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .subtitle { font-size: 14px; color: #888; margin-bottom: 20px; }
    .catalog-badge { background: #1DB954; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .nav-bar { 
        display: flex; 
        gap: 10px; 
        margin-bottom: 20px; 
        padding: 10px 0;
        border-bottom: 2px solid #1DB954;
    }
    .nav-btn {
        background: #1a1a24;
        color: #888;
        padding: 8px 16px;
        border-radius: 5px;
        text-decoration: none;
        font-weight: 600;
        border: 1px solid transparent;
    }
    .nav-btn:hover { background: #2a3a2a; color: #1DB954; border-color: #1DB954; }
    .nav-btn.active { background: #1DB95420; color: #1DB954; border-color: #1DB954; }
</style>
""", unsafe_allow_html=True)

# Navigation Bar
st.markdown("""
<div class="nav-bar">
    <span style="font-size: 1.3rem; font-weight: bold; margin-right: 20px;">
        <span style="color: #fff;">Buss</span><span style="color: #1DB954;">Groove</span>
    </span>
    <a href="http://localhost:5000" target="_blank" class="nav-btn">🏠 Station HQ</a>
    <span class="nav-btn active">🎹 Analyzer</span>
    <a href="http://localhost:3000" target="_blank" class="nav-btn">📊 Database UI</a>
    <a href="http://localhost:5000" target="_blank" class="nav-btn">🎬 Production</a>
</div>
""", unsafe_allow_html=True)

st.markdown('<div class="header-title">🎹 BussGroove Audio Analyzer</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Reverse-engineer tracks → Generate instrumental Suno prompts</div>', unsafe_allow_html=True)


def convert_video_to_audio(video_path, output_path):
    """Convert MP4/video to MP3 using FFmpeg."""
    try:
        cmd = [
            'ffmpeg', '-y', '-i', video_path,
            '-vn',  # No video
            '-acodec', 'libmp3lame',
            '-ab', '192k',
            '-ar', '44100',
            output_path
        ]
        # run ffmpeg, fail on non-zero exit to surface errors
        subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=120)
        return os.path.exists(output_path)
    except Exception as e:
        st.error(f"FFmpeg conversion failed: {e}")
        return False


# --- Sidebar ---
with st.sidebar:
    st.header("📂 Reference Track")
    st.caption("Supports: MP3, WAV, FLAC, M4A, **MP4** (auto-converts)")
    upload_file = st.file_uploader("Drop audio/video here", type=['mp3', 'wav', 'flac', 'm4a', 'mp4', 'webm', 'mkv'])
    
    st.divider()
    st.caption("Or select from downloads folder:")
    
    local_files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.mp3")) + glob.glob(os.path.join(DOWNLOADS_DIR, "*.wav"))
    selected_local_file = st.selectbox(
        "Downloaded tracks:",
        ["-- Select --"] + [os.path.basename(f) for f in local_files],
        label_visibility="collapsed"
    )

# --- Main Logic ---
target_file_path = None
conversion_needed = False

if upload_file is not None:
    original_ext = os.path.splitext(upload_file.name)[1].lower()
    
    # Check if video file that needs conversion
    if original_ext in ['.mp4', '.webm', '.mkv']:
        conversion_needed = True
        temp_video_path = os.path.join(UPLOAD_DIR, upload_file.name)
        target_file_path = os.path.join(UPLOAD_DIR, upload_file.name.replace(original_ext, '.mp3'))
        
        # Save video first
        with open(temp_video_path, "wb") as f:
            f.write(upload_file.getbuffer())
        
        # Convert
        with st.status("🔄 Converting video to audio...", expanded=True) as convert_status:
            st.write(f"Extracting audio from {upload_file.name}...")
            if convert_video_to_audio(temp_video_path, target_file_path):
                convert_status.update(label="✅ Converted to MP3", state="complete")
                st.success(f"✓ Loaded: {os.path.basename(target_file_path)}")
                # Clean up video file
                try:
                    os.remove(temp_video_path)
                except:
                    pass
            else:
                st.error("⚠️ FFmpeg not found! Install FFmpeg or upload MP3/WAV directly.")
                target_file_path = None
    else:
        # Regular audio file
        target_file_path = os.path.join(UPLOAD_DIR, upload_file.name)
        with open(target_file_path, "wb") as f:
            f.write(upload_file.getbuffer())
        st.success(f"✓ Loaded: {upload_file.name}")

elif selected_local_file != "-- Select --":
    target_file_path = os.path.join(DOWNLOADS_DIR, selected_local_file)

# --- Analysis View ---
if target_file_path and os.path.exists(target_file_path):
    st.divider()
    
    col_left, col_right = st.columns([1, 2])
    
    with col_left:
        st.subheader("🎧 Target Audio")
        st.audio(target_file_path)
        analyze_btn = st.button("🔍 Analyze & Generate Prompt", type="primary")
        
    if analyze_btn:
        with col_right:
            # Progress container
            progress_container = st.container()
            
            with st.status("🎵 Analyzing audio...", expanded=True) as status:
                progress_bar = st.progress(0, text="Starting analysis...")
                
                try:
                    # Step 1: Load audio
                    progress_bar.progress(10, text="📂 Loading audio file...")
                    time.sleep(0.2)
                    
                    # Step 2: Detect tempo
                    progress_bar.progress(30, text="🥁 Detecting tempo & beats...")
                    
                    # Step 3: Run analysis
                    progress_bar.progress(50, text="🎹 Analyzing key & harmonics...")
                    results = analyze_track(target_file_path, include_transcription=False)
                    
                    # Step 4: Generate prompt
                    progress_bar.progress(80, text="✍️ Generating Suno prompt...")
                    outputs = generate_style_prompt(results)
                    
                    # Step 5: Complete
                    progress_bar.progress(100, text="✅ Analysis complete!")
                    time.sleep(0.3)
                    
                    status.update(label="✅ Analysis Complete", state="complete", expanded=False)
                    
                    # --- DISPLAY RESULTS ---
                    
                    # Catalog Badge
                    st.markdown(f'<span class="catalog-badge">{outputs["catalog"]}</span>', unsafe_allow_html=True)
                    
                    # Metrics
                    st.subheader("📊 Sonic DNA")
                    c1, c2, c3, c4 = st.columns(4)
                    c1.metric("BPM", f"{results['bpm']}")
                    c2.metric("Key", f"{results['key']}")
                    c3.metric("Energy", f"{results['energy']}/10")
                    c4.metric("Duration", f"{results['duration_seconds']}s")
                    
                    st.caption(f"**Mood:** {outputs['mood_keywords']} | **Lead:** {outputs['recommended_lead']}")
                    
                    st.divider()
                    
                    # ===========================
                    # STYLE PROMPT
                    # ===========================
                    st.subheader("📋 1. Style Prompt")
                    st.caption("Copy this into Suno's **Style of Music** field")
                    st.code(outputs['style_prompt'], language="text")
                    
                    st.divider()
                    
                    # ===========================
                    # STRUCTURE TEMPLATE (for longer songs)
                    # ===========================
                    st.subheader("🎼 2. Structure Template")
                    st.caption("Copy this into Suno's **Lyrics** field (creates 4-5 min songs)")
                    st.code(outputs['structure_template'], language="text")
                    
                    st.success("💡 **Result:** With both fields filled, Suno will generate ~4-5 minute instrumental tracks with proper structure!")
                    
                    # ===========================
                    # SAVE TO DATABASE
                    # ===========================
                    st.divider()
                    st.subheader("💾 3. Save to Database")
                    
                    col_save1, col_save2 = st.columns([1, 2])
                    with col_save1:
                        if st.button("💾 Save Prompt to Database", type="primary"):
                            prompt_id, count = save_prompt_to_database(outputs, results, outputs['catalog'])
                            if prompt_id:
                                st.session_state['last_saved_id'] = prompt_id
                                st.session_state['db_count'] = count
                                st.rerun()
                            else:
                                st.error(f"Save failed: {count}")
                    
                    with col_save2:
                        if 'last_saved_id' in st.session_state:
                            st.success(f"✅ Saved as **{st.session_state['last_saved_id']}** ({st.session_state['db_count']} prompts in database)")
                            st.markdown(f"[📊 View in Database UI →](http://localhost:3000/prompts)")
                        else:
                            st.caption("Save this prompt to your local database for later use")
                    
                    # Waveform
                    st.divider()
                    st.caption("Waveform")
                    st.line_chart(results['waveform'], height=60)
                    
                except Exception as e:
                    progress_bar.progress(100, text="❌ Error occurred")
                    st.error(f"Error: {e}")
                    import traceback
                    st.code(traceback.format_exc())

else:
    st.info("👈 Drop a reference track (audio or video) to analyze its vibe and generate a prompt.")
    
    # Quick info
    st.markdown("""
    ### 🎯 Supported Formats
    | Format | Notes |
    |--------|-------|
    | **MP3, WAV, FLAC, M4A** | Direct analysis |
    | **MP4, WebM, MKV** | Auto-converts to MP3 (requires FFmpeg) |
    
    ### 🎯 Supported Catalogs
    | Catalog | Tempo | Use Case |
    |---------|-------|----------|
    | **Jazz Lo-Fi Hip-Hop** | 75-95 BPM | Study beats, focus, chill |
    | **Afro Lounge** | 95-108 BPM | Hotels, spas, premium background |
    
    *All outputs are 100% instrumental - no vocals*
    """)
