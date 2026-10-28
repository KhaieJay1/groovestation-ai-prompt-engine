import sys
import os
import sqlite3
import shutil
import threading
import time
import yaml
from pathlib import Path
from collections import defaultdict
import logging
from flask import Flask, render_template, request, jsonify, send_file, make_response

# We will re-use the functions from orchestrator, but modify them to be called on demand
# or run in a background thread.
import orchestrator
# NEW: Workflow Automation
from workflow_manager import WorkflowManager
import thumbnail_generator
import csv
import io
import json
import requests # Added for Agent Service
from agent_service import SmartSunoGenerator, YouTubeMetadataGenerator

if getattr(sys, 'frozen', False):
    # Running in a PyInstaller bundle
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    # Running normally
    app = Flask(__name__)

print(f"DEBUG: App Path: {__file__}")
print(f"DEBUG: Current CWD: {os.getcwd()}")
print(f"DEBUG: Template Folder: {app.template_folder}")
log = logging.getLogger('werkzeug')
log.setLevel(logging.INFO)

# Load Prompts & Config
PROMPTS_FILE = "prompts.yaml"
# Config Loading & Hot Reload
def load_config():
    global YAML_DATA, GENRE_DATA, CONFIG_DATA, wm, ROOT_DIR, MUSIC_DIR, ASSETS_DIR, OUTPUT_DIR, INGEST_DIR, suno_gen, youtube_gen
    
    with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
        YAML_DATA = yaml.safe_load(f)
        GENRE_DATA = YAML_DATA.get('genres', {})
        CONFIG_DATA = YAML_DATA.get('config', {
            'folder_name': 'BussGroove', 
            'channel_name': 'BussGroove Station'
        })

    # LOAD DYNAMIC BRANDING (settings.json)
    try:
        if os.path.exists("settings.json"):
            with open("settings.json", 'r', encoding='utf-8') as f:
                branding = json.load(f)
                CONFIG_DATA['branding'] = branding
                # Override channel name if present
                if 'brand_name' in branding:
                    CONFIG_DATA['channel_name'] = branding['brand_name'] + " HQ"
                print("✅ App Loaded settings.json for Frontend Branding")
    except Exception as e:
        print(f"❌ Error loading settings.json in App: {e}")
        CONFIG_DATA['branding'] = {}
    # CONFIG
    DESKTOP_PATH = Path(os.path.expanduser("~/Desktop"))
    ROOT_DIR = DESKTOP_PATH / CONFIG_DATA['folder_name']

    # Initialize Workflow Manager w/ Reloaded Config
    wm = WorkflowManager(ROOT_DIR)

    # NEW 2025 STRUCTURE
    MUSIC_DIR = ROOT_DIR / "Music_Songs"
    ASSETS_DIR = ROOT_DIR / "Image_Assets"
    OUTPUT_DIR = ROOT_DIR / "Output_Mixes"
    INGEST_DIR = ROOT_DIR / "Suno_Ingest"  # NEW: Drop Suno downloads here

    # Ensure Directories Exist
    if not ROOT_DIR.exists(): ROOT_DIR.mkdir()
    for d in [MUSIC_DIR, ASSETS_DIR, OUTPUT_DIR, INGEST_DIR]:
        if not d.exists(): d.mkdir()
    
    for genre in GENRE_DATA.keys():
        (MUSIC_DIR / genre).mkdir(exist_ok=True)
        (ASSETS_DIR / genre).mkdir(exist_ok=True)
        (OUTPUT_DIR / genre).mkdir(exist_ok=True)

# ... (Imports) ...
from sound_lock_manager import SoundLockManager

# Global Managers
wm = None
slm = SoundLockManager()

# ... (Previous Config Loading) ...

@app.route('/api/soundlocks', methods=['GET'])
def list_soundlocks():
    """Returns all available Sound Lock profiles."""
    return jsonify(slm.get_all_profiles())

@app.route('/api/soundlock/active', methods=['GET'])
def get_active_soundlock():
    """Returns full details of the active profile."""
    return jsonify(slm.get_active_profile())

@app.route('/api/soundlock/set', methods=['POST'])
def set_active_soundlock():
    """Updates the active Sound Lock."""
    data = request.json
    profile_id = data.get('id')
    if not profile_id:
        return jsonify({'error': 'No ID provided'}), 400
    
    slm.set_active_profile(profile_id)
    return jsonify({'success': True, 'active_id': slm.active_id})

# ... (Rest of App) ...

    MUSIC_DIR = ROOT_DIR / "Music_Songs"
    ASSETS_DIR = ROOT_DIR / "Image_Assets"
    OUTPUT_DIR = ROOT_DIR / "Output_Mixes"
    INGEST_DIR = ROOT_DIR / "Suno_Ingest"  # NEW: Drop Suno downloads here

    # Ensure Directories Exist
    if not ROOT_DIR.exists(): ROOT_DIR.mkdir()
    for d in [MUSIC_DIR, ASSETS_DIR, OUTPUT_DIR, INGEST_DIR]:
        if not d.exists(): d.mkdir()
    
    for genre in GENRE_DATA.keys():
        (MUSIC_DIR / genre).mkdir(exist_ok=True)
        (ASSETS_DIR / genre).mkdir(exist_ok=True)
        (OUTPUT_DIR / genre).mkdir(exist_ok=True)

# Initial Load
load_config()


# Initial Load
load_config()

# MASTER CSV CONFIG (Legacy - Kept for reference)
MASTER_CSV_PATH = r"G:\My Drive\BussGroove_128_Playlists_Complete.csv"
DB_PATH = "schedule_master.db" # NEW SQLite DB

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/next-task')
def api_next_task():
    """Returns the single highest priority task."""
    try:
        conn = get_db()
        
        # 1. CURRENT TASK (Todo)
        current = conn.execute("""
            SELECT * FROM playlists 
            WHERE status != 'done' 
            ORDER BY id ASC LIMIT 1
        """).fetchone()

        # Inject Persona Prompt
        current_dict = dict(current) if current else None
        if current_dict:
            # The 'active_workspace_id' holds the Collection Name (e.g. Soul Jazz)
            # which matches the key in GENRE_DATA
            collection = current_dict.get('active_workspace_id')
            if collection and collection in GENRE_DATA:
                current_dict['persona_prompt'] = GENRE_DATA[collection].get('prompt', 'No prompt found.')
            else:
                current_dict['persona_prompt'] = "No prompt found for this collection."
        
        # 2. LAST DONE (History)
        last = conn.execute("""
            SELECT * FROM playlists 
            WHERE status = 'done' 
            ORDER BY id DESC LIMIT 1
        """).fetchone()
        
        # 3. NEXT UPCOMING (Future)
        # If we have a current task, get the one after it. 
        # If no current task, get nothing.
        upcoming = None
        if current:
            upcoming = conn.execute("""
                SELECT * FROM playlists 
                WHERE id > ? AND status != 'done'
                ORDER BY id ASC LIMIT 1
            """, (current['id'],)).fetchone()
            
        return jsonify({
            'current': current_dict,
            'last': dict(last) if last else None,
            'next': dict(upcoming) if upcoming else None
        })
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/open-folder', methods=['POST'])
def api_open_folder():
    """Opens the local folder for the current task."""
    try:
        path = request.json.get('path')
        if not path:
            return jsonify({'error': 'No path provided'}), 400
        
        # Security check: Ensure path is within allowed directories
        target_path = os.path.abspath(path)
        
        if not os.path.exists(target_path):
             return jsonify({'error': 'Path does not exist'}), 404
             
        os.startfile(target_path)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-prompts', methods=['POST'])
def api_generate_prompts():
    """Generates prompts for the current task."""
    try:
        import generate_prompts
        import importlib
        importlib.reload(generate_prompts)
        
        conn = get_db()
        current = conn.execute("SELECT * FROM playlists WHERE status != 'done' ORDER BY id ASC LIMIT 1").fetchone()
        
        if not current:
            return jsonify({'error': 'No active task'}), 404
            
        key = current['active_workspace_id']
        success = generate_prompts.generate_prompts_for_playlist(current['id'], key)
        
        if success:
             return jsonify({'success': True, 'message': 'Prompts Generated!'})
        else:
             return jsonify({'error': 'Failed to generate prompts. Check console.'}), 500
             
    except Exception as e:
        print(f"Gen Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/open-special-folder', methods=['POST'])
def api_open_special_folder():
    """Opens specific app directories (Ingest, Output, etc)."""
    try:
        folder_type = request.json.get('type')
        target_path = None
        
        if folder_type == 'ingest':
            target_path = INGEST_DIR
        elif folder_type == 'output':
            # Try to open genre specific output if provided
            genre = request.json.get('genre')
            if genre:
                target_path = OUTPUT_DIR / genre
            else:
                target_path = OUTPUT_DIR
        elif folder_type == 'assets':
             genre = request.json.get('genre')
             if genre:
                 target_path = ASSETS_DIR / genre
             else:
                 target_path = ASSETS_DIR
        elif folder_type == 'music_source':
             genre = request.json.get('genre')
             if genre:
                 target_path = MUSIC_DIR / genre
             else:
                 target_path = MUSIC_DIR
        
        if target_path and os.path.exists(target_path):
             os.startfile(target_path)
             return jsonify({'success': True, 'path': str(target_path)})
        else:
             return jsonify({'error': f'Path not found: {target_path}'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/master/load')
def api_master_load():
    """Returns all generated prompts formatted as MASTER_DATA for the UI."""
    try:
        conn = get_db()
        # Join playlists to get naming context if needed, or just return prompts
        rows = conn.execute("""
            SELECT p.id as prompt_id, p.song_name, p.prompt_text, p.is_used, 
                   pl.active_workspace_id as collection, pl.name as playlist_name 
            FROM prompts p
            JOIN playlists pl ON p.playlist_id = pl.id
        """).fetchall()
        
        data = []
        for r in rows:
            # ID Formatting: 01, 02...
            # We construct a fake Track_ID for UI compatibility: e.g. "Collection-01"
            # actually UI uses it for display.
            
            data.append({
                'Track_ID': str(r['prompt_id']).zfill(2), # Simple ID for now
                'Playlist_Name': r['playlist_name'],     # "Reflective Sessions"
                'Collection': r['collection'],           # "Soul Jazz" (used for filtering)
                'Suno_Prompt': r['prompt_text'],
                'Mood_Twist': r['song_name'],            # Using Song Title as Mood/Twist display
                'Status': 'Done' if r['is_used'] else 'Ready',
                'Catalog_Tag': r['collection']
            })
            
        return jsonify({'data': data})
    except Exception as e:
        print(f"Master Load Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/skip-task', methods=['POST'])
def api_skip_task():
    """Marks the current 'todo' task as 'done' and moves to next."""
    try:
        conn = get_db()
        # Find current task
        task = conn.execute("SELECT id FROM playlists WHERE status != 'done' ORDER BY id ASC LIMIT 1").fetchone()
        if task:
            conn.execute("UPDATE playlists SET status = 'done' WHERE id = ?", (task['id'],))
            conn.commit()
            return jsonify({'success': True, 'skipped_id': task['id']})
        return jsonify({'error': 'No tasks to skip'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GLOBALS

job_queue = []
is_processing = False
current_status_message = "System Ready..."

# Helper: Get style category for a genre
def get_style_for_genre(genre):
    """Returns the catalog tag (e.g., 'Lounge' or 'Jazz') for a genre."""
    playlist_meta = CONFIG_DATA.get('playlist_meta', {})
    genre_meta = playlist_meta.get(genre, {})
    return genre_meta.get('catalog_tag', 'Music')

# Helper: Get SEO keywords for a genre
def get_seo_for_genre(genre):
    """Returns first SEO keyword for a genre (for title generation)."""
    playlist_meta = CONFIG_DATA.get('playlist_meta', {})
    genre_meta = playlist_meta.get(genre, {})
    seo = genre_meta.get('seo_keywords', 'Instrumental Music')
    # Handle both string and list formats
    if isinstance(seo, list):
        return seo[0] if seo else 'Instrumental Music'
    return seo

# Helper: Generate YouTube title
def generate_youtube_title(genre, volume):
    """Generate YouTube title: {Playlist} Playlist | {SEO Keywords} | BussGroove {Catalog} Vol. {##}"""
    seo = get_seo_for_genre(genre)
    catalog = get_style_for_genre(genre)
    vol_str = str(volume).zfill(2)
    return f"{genre} Playlist | {seo} | BussGroove {catalog} Vol. {vol_str}"

# --- ROUTES ---

@app.route('/')
def home():
    response = make_response(render_template('index.html', config=CONFIG_DATA))
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.route('/api/prompts')
def get_prompts():
    load_config() # HOT RELOAD
    # Enrich data with asset counts
    data = GENRE_DATA.copy()
    for genre in data:
        asset_path = ASSETS_DIR / genre
        count = 0
        if asset_path.exists():
            # Count jpg/png
            count = len(list(asset_path.glob('*.jpg'))) + len(list(asset_path.glob('*.png')))
        data[genre]['asset_count'] = count
    return jsonify(data)

@app.route('/api/status')
def get_status():
    global job_queue, current_status_message, is_processing
    return jsonify({
        'queue_size': len(job_queue), 
        'processing': is_processing,
        'status_msg': current_status_message
    })

@app.route('/api/settings', methods=['GET', 'POST'])
def manage_settings():
    """Read or Update settings.json"""
    if request.method == 'GET':
        settings = {}
        if os.path.exists("settings.json"):
            with open("settings.json", 'r', encoding='utf-8') as f:
                settings = json.load(f)
        return jsonify(settings)
    
    if request.method == 'POST':
        new_settings = request.json
        with open("settings.json", 'w', encoding='utf-8') as f:
            json.dump(new_settings, f, indent=4)
        
        # Reload Config immediately
        load_config()
        return jsonify({'success': True, 'message': '✅ Settings Saved & App Reloaded'})

@app.route('/api/master/load')
def load_master_data():
    data = []
    
    def normalize_row(r):
        """Normalize CSV row keys to match expected frontend format"""
        new_row = {}
        for k, v in r.items():
            # Handle BOM or spaces
            clean_k = k.strip().replace('\ufeff', '')
            
            # Map variations to standard Track_ID
            if clean_k.lower() in ['track_id', 'track id', 'id', 'trackid']:
                clean_k = 'Track_ID'
            elif clean_k.lower() in ['playlist_name', 'playlist name', 'playlist']:
                clean_k = 'Playlist_Name'
            elif clean_k.lower() in ['suno_prompt', 'prompt', 'style user prompt']:
                clean_k = 'Suno_Prompt'
                
            new_row[clean_k] = v
        return new_row

    # 1. Try G: Drive
    if os.path.exists(MASTER_CSV_PATH):
        try:
            with open(MASTER_CSV_PATH, 'r', encoding='utf-8-sig') as f: # Use utf-8-sig to handle BOM automatically
                reader = csv.DictReader(f)
                data = [normalize_row(row) for row in reader]
            print(f"✅ Loaded Master CSV from G Drive: {len(data)} rows")
        except Exception as e:
            print(f"❌ Error reading G Drive CSV: {e}")
            
    # 2. Try Fallback (Local Database)
    if not data:
        # Fallback to the one we generated earlier if G drive fails
        local_db = Path(r"./workspace\BussGroove\Database")
        # Try to find any playlists_*.csv
        if local_db.exists():
            for csv_file in local_db.glob("playlists_*.csv"):
                try:
                    with open(csv_file, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        data.extend([normalize_row(row) for row in reader])
                except: pass
            if data:
                print(f"⚠️ Loaded Fallback Local CSVs: {len(data)} rows")
             
    return jsonify({'data': data})

@app.route('/api/youtube_title/<genre>')
def get_youtube_title(genre):
    """Auto-generate YouTube title for a genre."""
    if genre not in GENRE_DATA:
        return jsonify({'title': '', 'error': f'Invalid genre: {genre}'}), 400
    
    # Get next volume number
    genre_config = GENRE_DATA.get(genre, {})
    next_vol = genre_config.get('last_volume', 0) + 1
    
    # Count existing mix folders to determine actual volume
    genre_music_dir = MUSIC_DIR / genre
    if genre_music_dir.exists():
        mix_dirs = [d for d in genre_music_dir.iterdir() if d.is_dir() and d.name.startswith("Mix")]
        next_vol = len(mix_dirs) if len(mix_dirs) > 0 else 1
    
    title = generate_youtube_title(genre, next_vol)
    style = get_style_for_genre(genre)
    
    return jsonify({
        'title': title,
        'genre': genre,
        'style': style,
        'volume': next_vol,
        'year': CONFIG_DATA.get('year', 2026)
    })

@app.route('/api/upload', methods=['POST'])
def handle_upload():
    """
    Receives files and permanently moves them to:
    - Desktop/{Genre}/Mix X (if music)
    - Desktop/BussGroove/Assets/{Genre} (if asset)
    """
    genre = request.form.get('genre')
    upload_type = request.form.get('type', 'music') # Default to music
    uploaded_files = request.files.getlist("files")
    
    if genre not in GENRE_DATA:
        return jsonify({'message': '❌ Invalid Genre'}), 400
        
    # Determine base target based on type
    if upload_type == 'asset':
        target_root = ASSETS_DIR / genre
    else:
        target_root = MUSIC_DIR / genre
    
    if upload_type == 'asset':
        # Asset Upload Logic
        target_folder = ASSETS_DIR / genre
        saved_filenames = []
        count = 0
        import time
        from werkzeug.utils import secure_filename
        
        for file in uploaded_files:
            if file.filename == '': continue
            
            # CRITICAL FIX: Sanitize and truncate filename to prevent Windows MaxPath crash
            # User uploads super long Midjourney filenames. We rename to safe timestamp.
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png']: ext = '.jpg'
            
            safe_name = f"{genre}_Asset_{int(time.time())}_{count}{ext}"
            saved_filenames.append(safe_name)
            save_path = target_folder / safe_name
            
            file.save(str(save_path))
            count += 1
        return jsonify({'message': f"✅ Added {count} images to {genre} Assets", 'files': saved_filenames})

    else:
        # Music Upload Logic (Existing)
        # New Mix batch for every upload session for safety.
        mix_dirs = [d for d in target_root.iterdir() if d.is_dir() and d.name.startswith("Mix")]
        next_num = len(mix_dirs) + 1
        
        mix_folder = target_root / f"Mix {next_num}"
        mix_folder.mkdir(exist_ok=True)
        
        count = 0
        for file in uploaded_files:
            if file.filename == '': continue
            
            # Save file to the target location
            save_path = mix_folder / file.filename
            file.save(str(save_path))
            
            # Also Add to Queue for processing
            job_queue.append(save_path)
            count += 1
            
        return jsonify({'message': f"✅ Moved {count} tracks to {mix_folder}"})

@app.route('/api/process', methods=['POST'])
def start_processing():
    global is_processing
    if is_processing:
        return jsonify({'message': '⚠️ Factory is already running!'})
    
    if not job_queue:
        return jsonify({'message': '⚠️ Queue is empty. Upload files first.'})
        
    # Get Custom Config from Frontend
    custom_config = request.json or {}
        
    # Start background thread
    thread = threading.Thread(target=run_processor, args=(custom_config,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'message': '🚀 Started Processing Queue...'})

@app.route('/api/open_folder', methods=['POST'])
def open_folder():
    path = request.json.get('path')
    if not path:
        return jsonify({'message': '❌ No path provided'}), 400
        
    p = Path(path)
    if not p.exists():
        return jsonify({'message': '❌ Folder not found'}), 404
        
    try:
        os.startfile(str(p)) # Windows only
        return jsonify({'message': '📂 Folder Opened'})
    except Exception as e:
        return jsonify({'message': f'❌ Could not open folder: {e}'}), 500

def run_processor(custom_config={}):
    global is_processing, job_queue, current_status_message
    is_processing = True
    print("Background Processor Started")
    
    active_batch = list(job_queue) # Copy
    job_queue = [] # Clear global immediately
    
    # 1. Group by Mix Folder to identify distinct batches
    batches = defaultdict(list)
    for file_path in active_batch:
        batches[file_path.parent].append(file_path)
    
    total_batches = len(batches)
    processed_count = 0

    for mix_folder, files in batches.items():
        processed_count += 1
        # mix_folder = .../Brass Grooves/Mix 1
        # parent = Brass Grooves
        genre_name = mix_folder.parent.name
        
        try:
            current_status_message = f"⚙️ Building Mix {processed_count}/{total_batches}: {genre_name} ({len(files)} songs)..."
            print(f"Starting Batch for {genre_name}")
            
            # CALL THE NEW BATCH ORCHESTRATOR
            mid_path = orchestrator.process_batch_mix(genre_name, files, mix_folder, custom_config)
            
            # Success Message with explicit path for frontend to pick up if needed
            # We will rely on the "Open Folder" button logic which we can infer from the mix_folder
            current_status_message = f"✅ DONE! Saved to: {mid_path}" # mid_path is now the renamed path if successful
            
        except Exception as e:
            current_status_message = f"❌ Error on {genre_name}: {e}"
            print(f"Error on batch {mix_folder}: {e}")
    
    is_processing = False
    print("Background Processor Finished")

@app.route('/api/preview/background/<genre>')
def get_preview_background(genre):
    asset_folder = ASSETS_DIR / genre
    if not asset_folder.exists():
        return jsonify({'error': 'Genre not found'}), 404
    
    valid_images = list(asset_folder.glob("*.jpg")) + list(asset_folder.glob("*.png"))
    if not valid_images:
        return jsonify({'error': 'No images found'}), 404
        
    import random
    from flask import send_file
    
    # CONSISTENCY FIX: Sort by Newest (Modified Time)
    # This matches the Orchestrator's new logic
    valid_images.sort(key=os.path.getmtime, reverse=True)
    selected = valid_images[0]
    
    return send_file(selected)

@app.route('/api/generate_thumbnail', methods=['POST'])
def api_generate_thumbnail():
    data = request.json
    # FIX: Frontend sends 'line1_text', backend was looking for 'line1'
    l1 = data.get('line1_text') or data.get('line1') or ""
    l2 = data.get('line2_text') or data.get('line2') or ""
    l3 = data.get('line3_text') or data.get('line3') or ""
    genre = data.get('genre', "Unknown")
    
    l1_config = data.get('line1_config', {})
    l2_config = data.get('line2_config', {})
    l3_config = data.get('line3_config', {})
    
    # Try to find a background image for this genre
    asset_folder = ASSETS_DIR / genre
    bg_img = None
    
    # FIX: Check for manual override from frontend
    override_bg = data.get('background_image')
    
    if override_bg and (asset_folder / override_bg).exists():
        bg_img = asset_folder / override_bg
        print(f"Using Override Background: {bg_img}")
    elif asset_folder.exists():
        import random
        # Sort by newest first to prioritize recent uploads
        valid_images = list(asset_folder.glob("*.jpg")) + list(asset_folder.glob("*.png"))
        valid_images.sort(key=os.path.getmtime, reverse=True)
        
        if valid_images:
            # Default to newest if no override, or random? 
            # Frontend preview shows newest. Let's match that default.
            bg_img = valid_images[0]
            
    if not bg_img:
        return jsonify({"message": "❌ No background image found for this genre. Upload one first!"}), 400
        
    output_path = OUTPUT_DIR / genre / "manual_thumbnail.jpg"
    output_path.parent.mkdir(exist_ok=True, parents=True)
    
    # Correction based on the Golden spec sync:
    # L1 (631, 802) - Genre
    # L2 (202, 938) - Large Title
    # L3 (1394, 988) - Small Series
    
    # Re-calling with corrected mapping for the manual tool
    success = thumbnail_generator.generate_youtube_thumbnail(
        background_image_path=bg_img,
        output_path=output_path,
        line1_text=l1,
        line2_text=l2, # Large title
        line3_text=l3,  # Small volume
        line1_config=l1_config,
        line2_config=l2_config,
        line3_config=l3_config
    )
    
    if success:
        return jsonify({
            "message": f"✅ Thumbnail generated: {output_path.name}",
            "path": str(output_path.parent)
        })
    else:
        return jsonify({"message": "❌ Thumbnail generation failed"}), 500

# --- WORKFLOW ROUTES ---

@app.route('/api/workflow/state')
def get_workflow_state():
    load_config() # HOT RELOAD
    return jsonify(wm.get_planner_state())

@app.route('/api/workflow/update', methods=['POST'])
def update_workflow_status():
    data = request.json
    genre = data.get('genre')
    status = data.get('status')
    next_vol = data.get('next_vol')
    
    success, msg = wm.update_vibe_status(genre, status, next_vol)
    if success:
        return jsonify({'message': '✅ Saved'})
    else:
        return jsonify({'message': f'❌ Error: {msg}'}), 400

@app.route('/api/workflow/generate_title', methods=['POST'])
def generate_workflow_title():
    data = request.json
    genre = data.get('genre')
    return jsonify({'title': wm.generate_next_title(genre)})

@app.route('/api/workflow/ingest', methods=['POST'])
def ingest_folder_route():
    data = request.json
    source_path = data.get('path')
    genre = data.get('genre')
    vol = data.get('vol') # Optional
    
    success, msg = wm.ingest_folder(source_path, genre, vol)
    if success: 
        return jsonify({'message': msg})
    else:
        return jsonify({'message': f'❌ {msg}'}), 400

@app.route('/api/workflow/generate_prompts', methods=['POST'])
def generate_prompts_route():
    """
    Generates 20 prompt variations for a given genre/playlist.
    Each prompt has unique BPM, Key, and Lead instrument for variety.
    """
    data = request.json
    genre = data.get('genre')
    count = data.get('count', 20)
    
    if genre not in GENRE_DATA:
        return jsonify({'message': '❌ Invalid Genre', 'prompts': []}), 400
    
    variations = wm.generate_prompt_variations(genre, count)
    
    return jsonify({
        'message': f'✅ Generated {len(variations)} prompts for {genre}',
        'prompts': variations
    })

# --- AI BRAIN ROUTES (OLLAMA) ---

@app.route('/api/brain/status')
def get_brain_status():
    """Check if Ollama is running."""
    try:
        if youtube_gen.check_status():
             return jsonify({'status': 'online', 'model': 'llama3.2'})
    except: pass
    return jsonify({'status': 'offline'}), 503

@app.route('/api/brain/generate_prompts', methods=['POST'])
def brain_generate_prompts():
    """Use Ollama to generate strict, valid musical prompts."""
    data = request.json
    genre = data.get('genre')
    count = data.get('count', 10)
    
    if not genre: return jsonify({'error': 'No genre provided'}), 400
    
    # Reload config to ensure rules are fresh
    load_config() 
    
    prompts = suno_gen.generate_batch(genre, count)
    
    if isinstance(prompts, dict) and 'error' in prompts:
        return jsonify(prompts), 400
        
    return jsonify({
        'message': f'✅ Brain generated {len(prompts)} smart prompts',
        'prompts': prompts
    })

@app.route('/api/brain/generate_metadata', methods=['POST'])
def brain_generate_metadata():
    """Use Ollama to generate YouTube SEO."""
    data = request.json
    genre = data.get('genre')
    mix_info = data.get('mix_info', {}) # {vol: 5}
    
    if not genre: return jsonify({'error': 'No genre provided'}), 400
    
    result = youtube_gen.generate_seo(genre, mix_info)
    
    if 'error' in result:
        return jsonify(result), 500
        
    return jsonify({
        'message': '✅ Brain generated SEO metadata',
        'data': result
    })



from youtube_uploader import YouTubeUploader

# GLOBAL: Upload job tracking
upload_jobs = {}

def background_youtube_upload(job_id, video_path, title, desc, tags):
    """Background thread function to upload to YouTube"""
    global upload_jobs
    try:
        upload_jobs[job_id]['status'] = 'uploading'
        upload_jobs[job_id]['message'] = '🚀 Upload started...'
        
        uploader = YouTubeUploader()
        result = uploader.upload_video(video_path, title, desc, tags)
        
        upload_jobs[job_id]['status'] = 'complete'
        upload_jobs[job_id]['message'] = '✅ Upload Complete! Check YouTube Studio.'
        upload_jobs[job_id]['video_id'] = result.get('id', '')
        
    except Exception as e:
        upload_jobs[job_id]['status'] = 'error'
        upload_jobs[job_id]['message'] = f'❌ Upload Failed: {str(e)}'

@app.route('/api/workflow/upload_youtube', methods=['POST'])
def upload_youtube_route():
    """Start YouTube upload in background thread - returns immediately"""
    global upload_jobs
    
    data = request.json
    genre = data.get('genre')
    
    if not genre:
        return jsonify({'success': False, 'message': '❌ No genre specified'}), 400
        
    # 1. Check for client_secrets.json
    if not os.path.exists('client_secrets.json'):
        return jsonify({'success': False, 'message': '❌ Missing client_secrets.json. Please download it from Google Cloud Console and place it in the project folder.'}), 400
        
    # 2. Find the video file
    candidates = []
    
    # Check "Output_Mixes" (Primary)
    out_dir = OUTPUT_DIR / genre
    if out_dir.exists():
        candidates.extend(list(out_dir.glob("**/*.mp4")))
        
    # Check "Music_Songs" (Secondary - where batches happen)
    mus_dir = MUSIC_DIR / genre
    if mus_dir.exists():
        candidates.extend(list(mus_dir.glob("**/output/*.mp4")))
        
    if not candidates:
        return jsonify({'success': False, 'message': f'❌ No videos found for {genre}. Build one first!'}), 404
        
    # Sort by modification time (Newest first)
    candidates.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    video_path = candidates[0]
    
    # 3. Prepare Metadata
    state = wm.get_planner_state().get(genre, {})
    
    # Generic Fallback
    title = f"{genre} Mix Vol. {state.get('next_vol', 'XX')} - BussGroove"
    desc = f"Enjoy this fresh {genre} mix!\n\n#BussGroove #{genre.replace(' ','')}"
    tags = ["BussGroove", genre, "Mix", "Music"]
    
    # NEW: Try to read optimized metadata.txt generated by the Renderer
    # It should be at video_path.with_suffix('.txt')
    meta_txt_path = video_path.with_suffix('.txt')
    if meta_txt_path.exists():
        try:
            with open(meta_txt_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Parse Title (First Line) and Description (Rest)
            lines = content.split('\n')
            if len(lines) > 0:
                potential_title = lines[0].strip()
                if potential_title:
                   title = potential_title
                   # Description is the rest
                   desc = '\n'.join(lines[1:]).strip()
                   print(f"✅ Loaded Optimized Metadata from {meta_txt_path.name}")
        except Exception as e:
            print(f"⚠️ Failed to read metadata.txt: {e}")

    if data.get('custom_title'): title = data.get('custom_title')
    if data.get('custom_desc'): desc = data.get('custom_desc')
    
    # 4. Create job and start background upload
    job_id = f"upload_{int(time.time())}"
    upload_jobs[job_id] = {
        'status': 'starting',
        'message': '🔄 Preparing upload...',
        'video_path': str(video_path),
        'title': title
    }
    
    # Start background thread
    upload_thread = threading.Thread(
        target=background_youtube_upload,
        args=(job_id, video_path, title, desc, tags)
    )
    upload_thread.daemon = True
    upload_thread.start()
    
    print(f"🚀 Started background upload: {job_id}")
    print(f"Video: {video_path.name}")
    print(f"Title: {title}")
    
    return jsonify({
        'success': True,
        'message': '🚀 Upload started in background! Please wait...',
        'job_id': job_id
    })

@app.route('/api/upload_status/<job_id>')
def get_upload_status(job_id):
    """Poll endpoint to check upload status"""
    global upload_jobs
    
    if job_id not in upload_jobs:
        return jsonify({'status': 'unknown', 'message': 'Job not found'}), 404
    
    job = upload_jobs[job_id]
    return jsonify({
        'status': job.get('status', 'unknown'),
        'message': job.get('message', ''),
        'video_id': job.get('video_id', '')
    })


@app.route('/api/manual_upload_youtube', methods=['POST'])
def manual_upload_youtube():
    """
    Manual upload endpoint for fallback.
    Accepts multipart/form-data with:
      - video: MP4 file
      - thumbnail: JPG/PNG file (optional)
      - title: string
      - description: string
    """
    # Check for client_secrets.json
    if not os.path.exists('client_secrets.json'):
        return jsonify({'success': False, 'message': '❌ Missing client_secrets.json. Download from Google Cloud Console.'}), 400
    
    # Get form data
    title = request.form.get('title', '')
    description = request.form.get('description', '')
    
    if not title:
        return jsonify({'success': False, 'message': '❌ Title is required'}), 400
    
    # Get video file
    video_file = request.files.get('video')
    if not video_file:
        return jsonify({'success': False, 'message': '❌ No video file provided'}), 400
    
    # Save video temporarily
    temp_dir = Path('temp_uploads')
    temp_dir.mkdir(exist_ok=True)
    
    video_filename = f"manual_upload_{int(time.time())}.mp4"
    video_path = temp_dir / video_filename
    video_file.save(str(video_path))
    
    # Get optional thumbnail
    thumbnail_path = None
    thumb_file = request.files.get('thumbnail')
    if thumb_file:
        thumb_ext = Path(thumb_file.filename).suffix or '.jpg'
        thumb_filename = f"manual_thumb_{int(time.time())}{thumb_ext}"
        thumbnail_path = temp_dir / thumb_filename
        thumb_file.save(str(thumbnail_path))
    
    print(f"🚀 Manual Upload: {video_path.name}")
    print(f"Title: {title}")
    
    # Upload
    uploader = YouTubeUploader()
    try:
        # Note: Thumbnail upload not currently supported - add manually in YouTube Studio
        result = uploader.upload_video(
            video_path, 
            title, 
            description, 
            tags=['BussGroove', 'Music', 'Mix']
        )
        
        # Cleanup temp files
        if video_path.exists():
            video_path.unlink()
        if thumbnail_path and thumbnail_path.exists():
            thumbnail_path.unlink()
        
        return jsonify({'success': True, 'message': f'✅ Upload Complete! Check YouTube Studio.'})
        
    except Exception as e:
        # Cleanup on error too
        if video_path.exists():
            video_path.unlink()
        if thumbnail_path and thumbnail_path.exists():
            thumbnail_path.unlink()
            
        return jsonify({'success': False, 'message': f'❌ Upload Failed: {str(e)}'}), 500


@app.route('/api/tracklist/<genre>')
def get_tracklist(genre):
    """
    Get the tracklist from the latest metadata.txt for a genre.
    Returns formatted tracklist for YouTube description.
    """
    if genre not in GENRE_DATA:
        return jsonify({'tracklist': '', 'error': 'Invalid genre'}), 400
    
    # Find the latest mix folder
    genre_music_dir = MUSIC_DIR / genre
    if not genre_music_dir.exists():
        return jsonify({'tracklist': '', 'error': 'No music folder found'})
    
    mix_dirs = [d for d in genre_music_dir.iterdir() if d.is_dir() and d.name.startswith("Mix")]
    if not mix_dirs:
        return jsonify({'tracklist': '', 'error': 'No mix folders found'})
    
    # Get the latest mix folder (highest number)
    mix_dirs.sort(key=lambda x: int(x.name.replace("Mix ", "").split()[0]) if x.name.replace("Mix ", "").split()[0].isdigit() else 0)
    latest_mix = mix_dirs[-1]
    
    # Check for metadata.txt
    metadata_path = latest_mix / "output" / "metadata.txt"
    if not metadata_path.exists():
        # Try direct in mix folder
        metadata_path = latest_mix / "metadata.txt"
    
    if not metadata_path.exists():
        return jsonify({'tracklist': '', 'error': 'No metadata.txt found'})
    
    # Read and parse tracklist
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract tracklist section
        lines = content.split('\n')
        tracklist_lines = []
        in_tracklist = False
        
        for line in lines:
            if 'TRACKLIST:' in line:
                in_tracklist = True
                tracklist_lines.append('Tracklist 🎵')
                continue
            if in_tracklist:
                # Stop at empty line or hashtags
                if line.strip() == '' or line.startswith('#') or line.startswith('Total Duration'):
                    continue
                if line.strip():
                    # Format: convert "02:30 Song Title" to "[02:30] BussGroove – Song Title"
                    parts = line.strip().split(' ', 1)
                    if len(parts) == 2 and ':' in parts[0]:
                        timecode = parts[0]
                        title = parts[1]
                        tracklist_lines.append(f"[{timecode}] {title}")
                    else:
                        tracklist_lines.append(line.strip())
        
        tracklist_text = '\n'.join(tracklist_lines) if tracklist_lines else ''
        return jsonify({'tracklist': tracklist_text, 'mix_folder': str(latest_mix)})
        
    except Exception as e:
        return jsonify({'tracklist': '', 'error': str(e)})


@app.route('/api/ingest/<genre>', methods=['POST'])
def ingest_suno_files(genre):
    """
    Auto-rename files from Suno_Ingest folder and move to genre Mix folder.
    Uses song titles from prompts.yaml.
    
    POST /api/ingest/Golden Hour
    Body: { "dry_run": true/false }
    """
    global job_queue
    
    if genre not in GENRE_DATA:
        return jsonify({'success': False, 'error': f'Invalid genre: {genre}'}), 400
    
    data = request.json or {}
    dry_run = data.get('dry_run', True)
    
    # Get song titles from prompts.yaml
    genre_config = GENRE_DATA.get(genre, {})
    titles = genre_config.get('song_titles', [])
    
    if not titles:
        return jsonify({'success': False, 'error': f'No song titles found for {genre}'}), 400
    
    # Find audio files in Ingest folder
    audio_extensions = {'.mp3', '.m4a', '.mp4', '.wav', '.flac', '.aac'}
    audio_files = []
    
    for f in INGEST_DIR.iterdir():
        if f.is_file() and f.suffix.lower() in audio_extensions:
            audio_files.append(f)
    
    if not audio_files:
        return jsonify({
            'success': False, 
            'error': f'No audio files in Suno_Ingest folder. Drop your Suno downloads there first.',
            'ingest_path': str(INGEST_DIR)
        }), 400
    
    # Sort by modification time (oldest first = first generated)
    audio_files.sort(key=lambda x: x.stat().st_mtime)
    
    # Extend titles if needed (for Vol.02, Vol.03, etc.)
    extended_titles = []
    volume = 1
    while len(extended_titles) < len(audio_files):
        for title in titles:
            if len(extended_titles) >= len(audio_files):
                break
            if volume == 1:
                extended_titles.append(title)
            else:
                extended_titles.append(f"{title} Pt.{volume}")
        volume += 1
    
    # Create new Mix folder
    genre_music_dir = MUSIC_DIR / genre
    mix_dirs = [d for d in genre_music_dir.iterdir() if d.is_dir() and d.name.startswith("Mix")]
    next_num = len(mix_dirs) + 1
    mix_folder = genre_music_dir / f"Mix {next_num}"
    
    # Preview what will happen
    preview = []
    for i, file in enumerate(audio_files):
        title = extended_titles[i]
        number = str(i + 1).zfill(2)
        new_name = f"{number} - {title}{file.suffix}"
        preview.append({
            'old_name': file.name,
            'new_name': new_name,
            'target_folder': str(mix_folder)
        })
    
    if dry_run:
        return jsonify({
            'success': True,
            'dry_run': True,
            'file_count': len(audio_files),
            'genre': genre,
            'mix_folder': str(mix_folder),
            'preview': preview
        })
    
    # Actually rename and move files
    if not mix_folder.exists():
        mix_folder.mkdir(parents=True)
    
    moved_count = 0
    errors = []
    
    for i, file in enumerate(audio_files):
        title = extended_titles[i]
        number = str(i + 1).zfill(2)
        new_name = f"{number} - {title}{file.suffix}"
        new_path = mix_folder / new_name
        
        try:
            shutil.move(str(file), str(new_path))
            job_queue.append(new_path)  # Add to processing queue
            moved_count += 1
        except Exception as e:
            errors.append(f"{file.name}: {e}")
    
    return jsonify({
        'success': True,
        'dry_run': False,
        'moved_count': moved_count,
        'genre': genre,
        'mix_folder': str(mix_folder),
        'queue_size': len(job_queue),
        'errors': errors if errors else None,
        'message': f'✅ Ingested {moved_count} songs into {genre} Mix {next_num}. Ready to LAUNCH FACTORY!'
    })


@app.route('/api/ingest/status')
def ingest_status():
    """Check how many files are in the Suno_Ingest folder."""
    audio_extensions = {'.mp3', '.m4a', '.mp4', '.wav', '.flac', '.aac'}
    audio_files = [f for f in INGEST_DIR.iterdir() if f.is_file() and f.suffix.lower() in audio_extensions]
    
    return jsonify({
        'file_count': len(audio_files),
        'files': [f.name for f in sorted(audio_files, key=lambda x: x.stat().st_mtime)[:10]],  # First 10
        'ingest_path': str(INGEST_DIR)
    })


# --- MASTER CSV ROUTES ---

@app.route('/api/master/load')
def load_master_csv():
    """Reads the Master CSV and returns rows as JSON."""
    if not os.path.exists(MASTER_CSV_PATH):
        return jsonify({'error': 'Master CSV not found at ' + MASTER_CSV_PATH}), 404
        
    try:
        data = []
        with open(MASTER_CSV_PATH, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            data = list(reader)
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/master/update_status', methods=['POST'])
def update_master_status():
    """
    Updates the 'Status' of a track in the CSV.
    If 'Status' column doesn't exist, it will be added.
    Matches by 'Track_ID'.
    """
    req = request.json
    track_id = req.get('track_id')
    new_status = req.get('status')
    
    if not track_id or not new_status:
        return jsonify({'error': 'Missing track_id or status'}), 400
        
    if not os.path.exists(MASTER_CSV_PATH):
        return jsonify({'error': 'Master CSV not found'}), 404
        
    try:
        # Read all data
        rows = []
        fieldnames = []
        with open(MASTER_CSV_PATH, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames if reader.fieldnames else []
            rows = list(reader)
            
        # Ensure Status column exists
        if 'Status' not in fieldnames:
            fieldnames.append('Status')
            
        # Update row and track if found
        updated = False
        for row in rows:
            if row.get('Track_ID') == track_id:
                row['Status'] = new_status
                updated = True
                break
                
        if not updated:
            return jsonify({'error': 'Track ID not found'}), 404
            
        # Write back to temp file
        temp_path = MASTER_CSV_PATH + ".tmp"
        with open(temp_path, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
            
        # Replace original
        shutil.move(temp_path, MASTER_CSV_PATH)
        
        return jsonify({'success': True, 'message': f'Updated {track_id} to {new_status}'})
        
    except PermissionError:
        return jsonify({'error': 'File is open in another program (Excel?). Close it and try again.'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Triggering reload for Image Safety Update



if __name__ == '__main__':
    # Open browser automatically
    # Fix: Disable reloader to prevent restart loops from site-packages changes
    # and to keep in-memory job state (upload_jobs) alive.
    app.run(port=5000, debug=True, use_reloader=False)


