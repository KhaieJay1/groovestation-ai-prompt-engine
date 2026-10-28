
import sqlite3
import pandas as pd
import os
from pathlib import Path

# Configuration
DB_PATH = "schedule_master.db"
EXCEL_PATH = r"G:\My Drive\BussGroove_128_Playlists_Complete [Jan 23].xlsx"

# Schema Definition
SCHEMA = """
-- Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    catalog_tag TEXT NOT NULL,
    volume_number INTEGER,
    bpm_min INTEGER,
    bpm_max INTEGER,
    tracks_total INTEGER DEFAULT 20,
    tracks_completed INTEGER DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'todo',
    download_subpath TEXT,
    suno_persona TEXT,
    active_workspace_id TEXT,
    source_excel_row INTEGER -- To trace back to Excel
);

-- Prompts Table
CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER,
    track_number INTEGER,
    prompt_text TEXT,
    style_tags TEXT,
    title_idea TEXT,
    FOREIGN KEY(playlist_id) REFERENCES playlists(id)
);

-- System Paths
CREATE TABLE IF NOT EXISTS system_paths (
    key TEXT PRIMARY KEY,
    path TEXT NOT NULL
);
"""

def init_db():
    print(f"🚀 Initializing Database: {DB_PATH}")
    
    # Connect (creates file if not exists)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create Tables
    cursor.executescript(SCHEMA)
    
    # Insert Default Paths
    paths = [
        ('drop_zone', r"./workspace\Drop Suno Songs Here"),
        ('ingest_zone', r"./workspace\BussGroove\Suno_Ingest"),
        ('master_db_csv', EXCEL_PATH)
    ]
    cursor.executemany("INSERT OR IGNORE INTO system_paths (key, path) VALUES (?, ?)", paths)
    
    conn.commit()
    print("✅ Schema Created & Paths Configured.")
    return conn

def migrate_excel_data(conn):
    print(f"📊 Reading Excel Source: {EXCEL_PATH}")
    
    if not os.path.exists(EXCEL_PATH):
        print(f"❌ Excel file not found at: {EXCEL_PATH}")
        return

    try:
        # Load Excel - Assuming Sheet1 or searching for relevant columns
        # Note: Based on previous context, the file has columns like 'Playlist Name', 'Genre', etc.
        # We might need to inspect it first, but let's try a standard read
        df = pd.read_excel(EXCEL_PATH)
        
        # NORMALIZE COLUMNS (Strip whitespace)
        df.columns = df.columns.str.strip()
        
        print(f"   Found {len(df)} rows. Columns: {list(df.columns)}")
        
        count = 0
        cursor = conn.cursor()
        
        # Clear existing playlists to avoid duplicates during dev
        cursor.execute("DELETE FROM playlists")
        
        for index, row in df.iterrows():
            # MAPPING LOGIC - Customize based on actual Excel columns
            # Assuming columns: 'Playlist Name', 'Catalog', 'Vol', 'Due Date', 'Status'
            # If columns don't match, we default nicely.
            
            # Smart Extraction
            p_name = row.get('Playlist Name') or row.get('Playlist_Name') or f"Playlist {index+1}"
            
            # Skip empty rows
            if pd.isna(p_name): continue
            
            # Catalog/Genre Tag
            catalog = row.get('Catalog') or row.get('Genre') or "Unknown"
            
            # BPM Logic (Parse "80-90" or single int)
            bpm_raw = str(row.get('BPM', '80-100'))
            try:
                if '-' in bpm_raw:
                    b_min, b_max = map(int, bpm_raw.split('-'))
                else:
                    b_min = int(float(bpm_raw))
                    b_max = b_min
            except:
                b_min, b_max = 80, 100

            # Insert
            cursor.execute("""
                INSERT INTO playlists (
                    name, catalog_tag, volume_number, bpm_min, bpm_max, 
                    due_date, status, source_excel_row
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p_name,
                catalog,
                row.get('Vol') or 1,
                b_min,
                b_max,
                row.get('Due Date'),
                'todo', # Default status since Excel status might be complex text
                index + 2 # Header is row 1
            ))
            count += 1
            
        conn.commit()
        print(f"✅ Migrated {count} playlists from Excel.")
        
    except Exception as e:
        print(f"❌ Error migrating Excel data: {e}")

if __name__ == "__main__":
    try:
        connection = init_db()
        migrate_excel_data(connection)
        connection.close()
        print("\n🎉 Database Setup Complete! You can now connect the Dashboard.")
    except Exception as e:
        print(f"\n❌ CRITICAL FAILURE: {e}")
