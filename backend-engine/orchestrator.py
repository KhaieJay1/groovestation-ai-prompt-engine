"""
BussGroove Automation Orchestrator
Main entry point for the auto-upload pipeline.
"""

import sys
import time
import shutil
import logging
from pathlib import Path
import yaml

import yaml
import json
import random
import os
import subprocess

# Import our modules
import audio_processor
import thumbnail_generator
import video_generator
import concatenator

# Setup Logging
# Force UTF-8 on Windows to handle emojis 🎬
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("pipeline.log", encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# --- CONFIGURATION FROM YAML (Mocked for now) ---
CONFIG = {
    'dirs': {
        'input': Path('input_music'),
        # ... other mappings if needed, but we are shifting to dynamic paths passed from App
        'assets': Path(os.path.expanduser("~/Desktop/BussGroove/Assets"))
    },
    'defaults': {
        'bg_image': Path('assets/background_default.jpg'),
        'genre': 'Afro House'
    }
}

def load_config():
    # In future, load from config.yaml
    for key, path in CONFIG['dirs'].items():
        path.mkdir(exist_ok=True)
    CONFIG['dirs']['assets'].mkdir(exist_ok=True)

    with open("prompts.yaml", 'r', encoding='utf-8') as f:
        y = yaml.safe_load(f)
        conf = y.get('config', {})
        defaults = {'artist': 'Unknown AI', 'hashtags': '#Music'}
        # Merge
        defaults.update(conf)
        
    # LOAD BRANDING CONFIG (settings.json)
    try:
        if os.path.exists("settings.json"):
            with open("settings.json", 'r', encoding='utf-8') as f:
                branding = json.load(f)
                defaults['branding'] = branding
                logger.info("✅ Loaded settings.json for Dynamic Branding")
        else:
            defaults['branding'] = {}
            logger.warning("⚠️ settings.json not found, using defaults")
    except Exception as e:
        logger.error(f"❌ Error loading settings.json: {e}")
        defaults['branding'] = {}

    return defaults

GLOBAL_CONF = load_config()

def get_metadata(file_path: Path):
    """
    Extracts metadata from filename.
    Expected format: "Artist - Title.mp3" or just "Title.mp3"
    """
    # Simple parse
    stem = file_path.stem # Filename without extension
    if " - " in stem:
        parts = stem.rsplit(" - ", 1) # Split only on last occurrence if multiple? No, usually first is Artist
        # Let's assume Artist - Title
        parts = stem.split(" - ", 1)
        artist = parts[0].strip()
        title = parts[1].strip()
    else:
        artist = GLOBAL_CONF.get('artist_name', "BussGroove AI")
        title = stem.strip()
        
    return {
        "artist": artist,
        "title": title,
        "genre": CONFIG['defaults']['genre'],
        "clean_name": f"{artist} - {title}"
    }

def process_file(file_path: Path):
    logger.info(f"🚀 Starting job for: {file_path.name}")
    
    # DETERMINE GENRE FROM PARENT FOLDER (Since App puts them in folders)
    # file_path is something like .../BussGroove/Brass Grooves/Mix 1/Track.mp3
    # We want to know specific genre to pull correct asset
    
    try:
        # Assuming struct: .../Genre/Mix X/song.mp3
        # parent = Mix X, parent.parent = Genre
        genre_name = file_path.parent.parent.name
        # Sanity check: is this a known genre?
        # If not, fallback or try to detect from metadata
        logger.info(f"📂 Detected Genre Context: {genre_name}")
    except:
        genre_name = "Unknown"

    # 1. Setup job paths
    # We want output to stay in the Mix folder
    work_dir = file_path.parent / f".processing_{file_path.stem}"
    work_dir.mkdir(exist_ok=True)
    
    try:
        # Move file to processing
        current_audio = work_dir / file_path.name
        shutil.move(str(file_path), str(current_audio))
        
        meta = get_metadata(current_audio)
        
        # 2. Audio Processing
        mastered_audio = work_dir / "mastered.mp3"
        success = audio_processor.process_audio(current_audio, mastered_audio)
        if not success: raise Exception("Audio processing failed")
        
        # 3. Thumbnail Generation
        thumb_path = work_dir / "thumbnail.jpg"
        
        # ASSET BANK LOGIC
        # 1. Check if specific thumbnail provided? (Skipping for now)
        # 2. Check Asset Bank for this Genre
        asset_folder = CONFIG['dirs']['assets'] / genre_name
        bg_img = None
        
        if asset_folder.exists():
            # Get valid images
            valid_images = list(asset_folder.glob("*.jpg")) + list(asset_folder.glob("*.png"))
            if valid_images:
                bg_img = random.choice(valid_images)
                logger.info(f"🖼️ Selected Random Asset: {bg_img.name}")
            else:
                logger.warning(f"⚠️ No assets found in {asset_folder}")
        
        # If no bg asset, it will use code generated
        success = thumbnail_generator.generate_local_thumbnail(
            meta['title'], 
            thumb_path,
            background_image_path=bg_img
        )
        if not success: raise Exception("Thumbnail generation failed")
        
        # 4. Video Generation
        video_path = work_dir / "video.mp4"
        success = video_generator.create_visualization_video(mastered_audio, thumb_path, video_path)
        if not success: raise Exception("Video generation failed")
        
        # 5. Metadata File
        meta_text_path = work_dir / "metadata.txt"
        with open(meta_text_path, "w") as f:
            f.write(f"Title: {meta['clean_name']} ({meta['genre']} Mix)\n")
            f.write(f"Description:\nEnjoy this fresh {meta['genre']} track.\n\n#AfroHouse #BussGroove")
            
        # 6. Finalize
        # We want to leave it in the Mix Folder
        
        mix_folder = file_path.parent
        
        # Move the artifacts we want to keep
        # Allow overwrite? Yes
        final_video = mix_folder / f"{meta['clean_name']}.mp4"
        if final_video.exists(): os.remove(str(final_video))
        
        shutil.move(str(video_path), str(final_video))
        shutil.move(str(thumb_path), str(mix_folder / f"{meta['clean_name']}_thumb.jpg"))
        # We can skip info text if redundant, or keep it
        
        logger.info(f"✅ Job Finished! Video: {final_video}")
        
        # Cleanup work dir
        try:
            shutil.rmtree(str(work_dir))
            # Optional: Delete original mp3? Or keep it? keeping for now.
        except: pass
        
    except Exception as e:
        logger.error(f"❌ Job Failed: {e}")
        # Move to failed
        failed_dir = CONFIG['dirs']['failed'] / f"{file_path.name}_{job_id}"
        shutil.move(str(work_dir), str(failed_dir))
def get_file_duration(file_path):
    """Returns duration in seconds using ffprobe."""
    cmd = [
        'ffprobe', 
        '-v', 'error', 
        '-show_entries', 'format=duration', 
        '-of', 'default=noprint_wrappers=1:nokey=1', 
        str(file_path)
    ]
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return float(result.stdout.strip())
    except Exception as e:
        logger.error(f"Error getting duration for {file_path.name}: {e}")
        return 0.0

def generate_metadata_file(audio_files, output_path, genre):
    """Generates the metadata.txt with timecodes."""
    logger.info("📝 Generating Metadata & Timecodes...")
    
    # LOAD TITLES from YAML
    titles_pool = []
    try:
        with open("prompts.yaml", 'r', encoding='utf-8') as f:
            y = yaml.safe_load(f)
            titles_pool = y.get('genres', {}).get(genre, {}).get('song_titles', [])
    except Exception as e:
        logger.error(f"Could not load titles: {e}")
        
    total_seconds = 0.0
    lines = []
    
    # Header
    lines.append(f"Title: Best of {genre} Mix 2025 | BussGroove Station")
    lines.append(f"Description:\nEnjoy this exclusive {genre} mix generated by BussGroove AI.\n")
    lines.append("TRACKLIST:")
    
    used_titles = set()
    
    for file in audio_files:
        # Calculate MM:SS
        m, s = divmod(total_seconds, 60)
        h, m = divmod(m, 60)
        
        if h > 0:
            timecode = f"{int(h):02d}:{int(m):02d}:{int(s):02d}"
        else:
            timecode = f"{int(m):02d}:{int(s):02d}"
            
        # NAME GENERATION LOGIC
        # 1. Try to use filename if it looks manual (e.g. "My Cool Song.mp3" vs "audio_123.mp3")
        # Heuristic: If it has spaces and no underscores/numbers, keep it. 
        # But user asked for AUTOMATION. So let's default to Auto-Gen if it looks generated.
        
        clean_name = file.stem
        if " - " in clean_name:
             # Already nicely named: "Genre - Title"
            clean_name = clean_name.split(" - ", 1)[1]
        elif "_" in clean_name or any(char.isdigit() for char in clean_name):
            # Looks like a raw file (e.g. "brass_05.mp3") -> USE AUTO TITLE
            if titles_pool:
                # Pick unique title
                available = [t for t in titles_pool if t not in used_titles]
                if not available:
                    # Reset pool if we ran out (add variant)
                    candidate = random.choice(titles_pool) + " (Pt. 2)"
                else:
                    candidate = random.choice(available)
                
                used_titles.add(candidate)
                clean_name = candidate
            else:
                clean_name = f"BussGroove {genre} ID {random.randint(100,999)}"
        
        lines.append(f"{timecode} {clean_name}")
        
        # Add duration for next
        duration = get_file_duration(file)
        total_seconds += duration
        
    lines.append(f"\nTotal Duration: {int(total_seconds//60)} mins")
    lines.append(f"\n#BussGroove #{genre.replace(' ', '')} #Mix2025 #DeepHouse #Music")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
        
    return True

def process_batch_mix(genre_name, file_list, output_base_dir, custom_config={}):
    """
    Process a list of files into a Single Mega-Mix Video.
    file_list: List of Path objects to MP3s.
    output_base_dir: The 'Mix X' folder where output should go.
    custom_config: Dictionary of override values from the UI Designer.
    """
    logger.info(f"🚀 Starting Mega-Mix Batch for {genre_name}: {len(file_list)} files pending...")
    
    # 0. Filter for Audio Files Only & SORT
    valid_exts = {'.mp3', '.wav', '.flac', '.m4a'}
    audio_files = [f for f in file_list if f.suffix.lower() in valid_exts]
    audio_files.sort(key=lambda x: x.name) # Alphabetical Sort
    
    if not audio_files:
        raise Exception(f"No valid audio files found in batch! (Found: {[f.name for f in file_list]})")
        
    logger.info(f"🎵 Cleaned Batch: {len(audio_files)} audio tracks.")
    
    # 1. Setup Output Directory
    final_output_dir = output_base_dir / "output"
    final_output_dir.mkdir(exist_ok=True)
    
    # --- SOUND LOCK FORCEMENT (PHASE 4) ---
    from sound_lock_manager import SoundLockManager
    slm_local = SoundLockManager()
    active_profile = slm_local.get_active_profile()
    
    if active_profile:
        logger.info(f"🔒 Sound Lock Active: {active_profile['name']} (Enforcing Genre: {active_profile['genre_primary']})")
        genre_name = active_profile['genre_primary']
    else:
        logger.warning("🔓 No Sound Lock found! Using folder name as fallback.")
    # ----------------------------------------

    # Temporary work file
    ext = audio_files[0].suffix.lower() if audio_files else ".mp3"
    concatenated_audio = final_output_dir / f"full_mix_audio{ext}"
    final_video = final_output_dir / "full_mix_video.mp4"
    
    try:
        # Determine Titles (Use Custom or Defaults)
        # Prioritize 'lineX_text' (from Frontend) over 'lineX' (old manual key)
        # THUMBNAIL FORMAT: 2 lines - Genre Name + Style Category
        mix_num = output_base_dir.name.replace("Mix ", "").zfill(2)
        
        # Get style category from playlist_meta (Jazz or Lounge -> full name)
        playlist_meta = GLOBAL_CONF.get('playlist_meta', {})
        genre_meta = playlist_meta.get(genre_name, {})
        catalog_tag = genre_meta.get('catalog_tag', 'Music')
        
        # Map catalog_tag to full style name
        style_map = {
            'Jazz': 'Smooth Jazz Hip-Hop Beats',
            'Lounge': 'Afro Lounge'
        }
        style_name = style_map.get(catalog_tag, catalog_tag)
        
        # If user hasn't customized via Designer, use these defaults:
        # t1 = empty (we'll use t2 and t3 for the 2-line layout)
        # t2 = Genre name (BIG, prominent)
        # t3 = BussGroove {Style} (smaller, below)
        # t1 = empty (we'll use t2 and t3 for the 2-line layout)
        # t2 = Genre name (BIG, prominent)
        # t3 = BussGroove {Style} (smaller, below)
        
        # FIX: Check keys explicitly to allow empty strings (User Intent)
        t1 = custom_config['line1_text'] if 'line1_text' in custom_config else (custom_config.get('line1') if 'line1' in custom_config else "")
        t2 = custom_config['line2_text'] if 'line2_text' in custom_config else (custom_config.get('line2') if 'line2' in custom_config else genre_name)
        t3 = custom_config['line3_text'] if 'line3_text' in custom_config else (custom_config.get('line3') if 'line3' in custom_config else f"BussGroove {style_name}")
        
        # 2. Generate Metadata FIRST (Calculates timecodes)
        # Use T3 (Title) for metadata header
        metadata_path = final_output_dir / "metadata.txt"
        generate_metadata_file(audio_files, metadata_path, genre_name)
        
        # --- NEW FLOW: Professional Overlay System ---
        logger.info("🎬 Rendering Professional Overlay Video (No pre-concat)...")
        
        # A. Find Intro
        # Look in BussGroove/Voice_Intros/{Genre}
        intro_path = None
        # Assuming ROOT_DIR structure for BussGroove
        # Orchestrator doesn't know ROOT_DIR explicitly from GLOBAL_CONF easily, 
        # but we can infer from output_base_dir or custom path
        
        # Try standard path:
        # A. Find Intro with Robust Fallback
        # A. Find Intros / Overlay
        logo_path = None
        audio_intro_path = None
        
        # 0. Define Roots
        try:
             root_relative = output_base_dir.parent.parent.parent 
        except:
             root_relative = Path(r"./workspace\BussGroove")

        voice_intros_dir = root_relative / "Voice_Intros"
        if not voice_intros_dir.exists(): 
             voice_intros_dir = Path(r"./workspace\BussGroove\Voice_Intros")
             
        # 1. FIND LOGO OVERLAY
        # We look for the standard logo file
        potential_logos = [
            root_relative / "Image_Assets" / "logo_overlay.png",
            root_relative / "logo_icon.png"
        ]
        for p in potential_logos:
            if p.exists():
                logo_path = p
                logger.info(f"🖼️ Selected Logo Overlay: {logo_path.name}")
                break
        
        # 2. FIND AUDIO INTRO (Voice)
        if voice_intros_dir.exists():
            candidates = [
                genre_name,
                genre_name.replace(" ", "_"),
                genre_name.replace("_", " ")
            ]
            genre_folder = None
            for c in candidates:
                p = voice_intros_dir / c
                if p.exists():
                    genre_folder = p
                    break
            
            # Check specific folder
            if genre_folder:
                intros = list(genre_folder.glob("*.mp3")) + list(genre_folder.glob("*.wav"))
                if intros:
                    audio_intro_path = random.choice(intros)
                    logger.info(f"🎙️ Selected Voice Intro: {audio_intro_path.name}")
            
            # Fallback to General if no specific audio intro found
            if not audio_intro_path:
                general_folder = voice_intros_dir / "General"
                if general_folder.exists():
                     general_intros = list(general_folder.glob("*.mp3")) + list(general_folder.glob("*.wav"))
                     if general_intros:
                         audio_intro_path = random.choice(general_intros)
                         logger.info(f"🎙️ Using FALLBACK 'General' Voice Intro: {audio_intro_path.name}")

        # B. Prepare Tracks List with Metadata
        tracks_data = []
        for p in audio_files:
            dur = get_file_duration(p)
            meta = get_metadata(p)
            tracks_data.append({
                'path': str(p),
                'duration': dur,
                'title': meta['title'],
                'genre': genre_name 
            })
            
        # 4. Select Background Asset
        asset_folder = Path(os.path.expanduser(f"~/Desktop/BussGroove/Image_Assets/{genre_name}"))
        
        bg_img = None
        if asset_folder.exists():
            # 1. Check for Manual Override from UI
            override_bg = custom_config.get('background_image')
            selected_img = None
            
            if override_bg:
                potential_path = asset_folder / override_bg
                if potential_path.exists():
                    selected_img = potential_path
                    logger.info(f"📸 Selected Asset (Manual Override): {selected_img.name}")
            
            # 2. Fallback to Newest
            if not selected_img:
                valid_images = list(asset_folder.glob("*.jpg")) + list(asset_folder.glob("*.png"))
                if valid_images:
                    valid_images.sort(key=os.path.getmtime, reverse=True)
                    selected_img = valid_images[0]
                    logger.info(f"📸 Selected Asset (Newest): {selected_img.name}")
                
                # Logic for archiving used image
                used_folder = asset_folder / "Used"
                used_folder.mkdir(exist_ok=True)
                
                def archive_used_image():
                    try:
                        dest = used_folder / selected_img.name
                        if dest.exists():
                            base = selected_img.stem
                            ext = selected_img.suffix
                            counter = 1
                            while dest.exists():
                                dest = used_folder / f"{base}_{counter}{ext}"
                                counter += 1
                        shutil.move(str(selected_img), str(dest))
                        logger.info(f"♻️ Archived used image to: {dest.name}")
                    except Exception as e:
                        logger.warning(f"Could not archive image: {e}")
                
                bg_img = selected_img
                archive_func = archive_used_image
            else:
                 bg_img = selected_img # manual override
        
        if not bg_img:
             # Fallback default
             logger.warning("⚠️ No background found. Using default placeholder if possible.")


        # 5. Generate Professional Video
        # 5. Generate Professional Video
        success = video_generator.create_refined_video(
            tracks_data,
            bg_img,
            final_video
        )




        # B. Prepare Tracks List with Metadata
        tracks_data = []
        for p in audio_files:
            dur = get_file_duration(p)
            meta = get_metadata(p)
            tracks_data.append({
                'path': str(p),
                'duration': dur,
                'title': meta['title'], # or clean_name
                'genre': genre_name # or meta['genre']
            })
            
        # 4. Select Background Asset
        asset_folder = Path(os.path.expanduser(f"~/Desktop/BussGroove/Image_Assets/{genre_name}"))
        
        bg_img = None
        if asset_folder.exists():
            # 1. Check for Manual Override from UI
            override_bg = custom_config.get('background_image')
            selected_img = None
            
            if override_bg:
                potential_path = asset_folder / override_bg
                if potential_path.exists():
                    selected_img = potential_path
                    logger.info(f"📸 Selected Asset (Manual Override): {selected_img.name}")
            
            # 2. Fallback to Newest
            if not selected_img:
                valid_images = list(asset_folder.glob("*.jpg")) + list(asset_folder.glob("*.png"))
                if valid_images:
                    valid_images.sort(key=os.path.getmtime, reverse=True)
                    selected_img = valid_images[0]
                    logger.info(f"📸 Selected Asset (Newest): {selected_img.name}")
                
                # Logic for archiving used image
                used_folder = asset_folder / "Used"
                used_folder.mkdir(exist_ok=True)
                
                def archive_used_image():
                    try:
                        dest = used_folder / selected_img.name
                        if dest.exists():
                            base = selected_img.stem
                            ext = selected_img.suffix
                            counter = 1
                            while dest.exists():
                                dest = used_folder / f"{base}_{counter}{ext}"
                                counter += 1
                        shutil.move(str(selected_img), str(dest))
                        logger.info(f"♻️ Archived used image to: {dest.name}")
                    except Exception as e:
                        logger.warning(f"Could not archive image: {e}")
                
                bg_img = selected_img
                archive_func = archive_used_image
            else:
                 bg_img = selected_img # manual override
        
        if not bg_img:
             # Fallback default
             logger.warning("⚠️ No background found. Using default placeholder if possible.")
             # Must return error or handle?
             # For now let's hope exists.
             pass

        # 5. Generate Professional Video
        # 5. Generate Professional Video
        # 5. Generate Professional Video
        success = video_generator.create_refined_video(
            tracks_data,
            bg_img,
            final_video
        )
        
        if not success: raise Exception("Professional Video generation failed")

        
        # 6. Generate YouTube Thumbnail WITH CUSTOM CONFIG
        logger.info("🖼️ Creating YouTube Thumbnail...")
        youtube_thumb = final_output_dir / "youtube_thumbnail.jpg"
        
        thumbnail_generator.generate_youtube_thumbnail(
            background_image_path=bg_img,
            output_path=youtube_thumb,
            line1_text=t1,
            line2_text=t2,
            line3_text=t3,
            line1_config=custom_config.get('line1_config'),
            line2_config=custom_config.get('line2_config'),
            line3_config=custom_config.get('line3_config')
        )
        
        # 7. RENAME MIX FOLDER
        # User Request: (Afro House Trumpet Grooves | Golden Evening Mix | Dark Groove Vol. 05)
        # We will use all 3 lines to create the folder name.
        
        full_title_str = f"{t1} - {t2} - {t3}"
        
        # Sanitize for Windows (Remove illegal chars)
        safe_title = "".join([c if c.isalnum() or c in (' ', '-', '_', '.', ',') else '' for c in full_title_str]).strip()
        # Truncate if too long (Windows limit 255 but let's be safe)
        if len(safe_title) > 150: safe_title = safe_title[:150]
        
        new_folder_name = f"{output_base_dir.name} ({safe_title})"
        new_folder_path = output_base_dir.parent / new_folder_name
        
        if not new_folder_path.exists():
            try:
                os.rename(output_base_dir, new_folder_path)
                logger.info(f"✨ Renamed Mix Folder to: {new_folder_name}")
                final_nav_path = new_folder_path / "output"
            except Exception as e:
                logger.warning(f"Could not rename folder: {e}")
                final_nav_path = final_output_dir
        else:
            final_nav_path = final_output_dir
        
        logger.info(f"✅ Mega-Mix Complete! Saved to: {final_nav_path}")
        
        # Archive the used image so next video uses a different one
        if 'archive_func' in locals():
            archive_func()
        
        # Cleanup intermediate
        if concatenated_audio.exists():
            os.remove(str(concatenated_audio))
            
        return str(final_nav_path)

    except Exception as e:
        logger.error(f"❌ Batch Job Failed: {e}")
        raise e

def main():
    load_config()
    logger.info("👀 Watching 'input_music' for files... (Ctrl+C to stop)")
    
    # Simple Polling Loop
    while True:
        # Check input folder
        input_files = list(CONFIG['dirs']['input'].glob("*.*"))
        valid_exts = {'.mp3', '.wav', '.flac', '.m4a'}
        
        for file in input_files:
            if file.suffix.lower() in valid_exts:
                # Found a file!
                try:
                    process_file(file)
                except Exception:
                    continue # Skip to next
        
        time.sleep(5) # Wait 5 seconds before next scan

if __name__ == "__main__":
    main()
