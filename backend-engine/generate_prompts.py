import sqlite3
import yaml
import os
import random

DB_PATH = "schedule_master.db"
PROMPTS_FILE = "prompts.yaml"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def load_yaml():
    with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def generate_prompts_for_playlist(playlist_id, collection_name, count=20):
    conn = get_db()
    data = load_yaml()
    genres = data.get('genres', {})
    
    # 1. Get Genre Config
    if collection_name not in genres:
        print(f"❌ Error: Collection '{collection_name}' not found in prompts.yaml")
        return False
        
    config = genres[collection_name]
    base_prompt = config.get('prompt', '')
    titles = config.get('song_titles', [])
    
    if not base_prompt:
        print("❌ Error: No base prompt found.")
        return False
        
    print(f"✨ Generating {count} prompts for '{collection_name}'...")
    
    # 2. Check existing prompts
    existing = conn.execute("SELECT count(*) as c FROM prompts WHERE playlist_id = ?", (playlist_id,)).fetchone()['c']
    if existing >= count:
        print(f"⚠️ Playlist {playlist_id} already has {existing} prompts. Skipping.")
        return True

    # 3. Generate
    generated = 0
    for i in range(count):
        # Pick title (sequential then random/loop)
        if i < len(titles):
            title = titles[i]
        else:
            title = f"{collection_name} Vol. {i+1}"
            
        # Construct Prompt
        # We can append specific mood or instrument variations here if we want complexity
        # For now, we use the master persona prompt as requested by user ("Letting Things Settle" style)
        full_prompt = base_prompt
        
        # Insert
        try:
            conn.execute("""
                INSERT INTO prompts (playlist_id, song_name, prompt_text, is_used)
                VALUES (?, ?, ?, 0)
            """, (playlist_id, title, full_prompt))
            generated += 1
        except Exception as e:
            print(f"Error inserting prompt: {e}")
            
    conn.commit()
    print(f"✅ Successfully generated {generated} prompts.")
    return True

if __name__ == "__main__":
    # Test run on current active task
    conn = get_db()
    current = conn.execute("SELECT * FROM playlists WHERE status != 'done' ORDER BY id ASC LIMIT 1").fetchone()
    
    if current:
        print(f"🎯 Target: {current['name']} (ID: {current['id']})")
        # Use active_workspace_id as the mapping key (e.g. Soul Jazz)
        key = current['active_workspace_id']
        generate_prompts_for_playlist(current['id'], key)
    else:
        print("No active task found.")
