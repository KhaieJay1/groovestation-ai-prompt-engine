"""
BussGroove Tracklist Generator
Generates YouTube description tracklists from audio files.

Usage:
    python tracklist_generator.py <folder_path>
    
Output format:
    Tracklist 🎵
    [00:00] BussGroove – Song Title 1
    [02:30] BussGroove – Song Title 2
    ...
"""

import os
import sys
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4
from mutagen.flac import FLAC
from mutagen import File as MutagenFile


def get_audio_duration(filepath):
    """Get duration of audio file in seconds."""
    try:
        ext = os.path.splitext(filepath)[1].lower()
        
        if ext == '.mp3':
            audio = MP3(filepath)
        elif ext in ['.m4a', '.mp4', '.aac']:
            audio = MP4(filepath)
        elif ext == '.flac':
            audio = FLAC(filepath)
        else:
            # Try generic mutagen
            audio = MutagenFile(filepath)
        
        if audio is None:
            return None
        return audio.info.length
    except Exception as e:
        print(f"Warning: Could not read duration for {filepath}: {e}")
        return None


def format_timestamp(seconds):
    """Convert seconds to [MM:SS] or [H:MM:SS] format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"[{hours}:{minutes:02d}:{secs:02d}]"
    else:
        return f"[{minutes:02d}:{secs:02d}]"


def parse_filename(filename):
    """
    Parse filename to extract artist and title.
    Expected formats:
        - "Artist - Title.mp3"
        - "Artist – Title.mp3" (em dash)
        - "Title.mp3" (will use default artist)
    """
    name = os.path.splitext(filename)[0]
    
    # Try different separators
    for sep in [' - ', ' – ', ' — ']:
        if sep in name:
            parts = name.split(sep, 1)
            return parts[0].strip(), parts[1].strip()
    
    # No separator found, use default artist
    return "BussGroove", name.strip()


def generate_tracklist(folder_path, default_artist="BussGroove"):
    """
    Generate tracklist from all audio files in a folder.
    Returns formatted tracklist string.
    """
    if not os.path.isdir(folder_path):
        print(f"Error: {folder_path} is not a valid directory")
        return None
    
    # Supported audio extensions
    audio_extensions = {'.mp3', '.m4a', '.mp4', '.aac', '.flac', '.wav', '.ogg'}
    
    # Get all audio files
    audio_files = []
    for f in sorted(os.listdir(folder_path)):
        ext = os.path.splitext(f)[1].lower()
        if ext in audio_extensions:
            audio_files.append(f)
    
    if not audio_files:
        print(f"No audio files found in {folder_path}")
        return None
    
    print(f"Found {len(audio_files)} audio files\n")
    
    # Build tracklist
    tracklist_lines = ["Tracklist 🎵"]
    current_time = 0.0
    
    for filename in audio_files:
        filepath = os.path.join(folder_path, filename)
        
        # Get timestamp for this track
        timestamp = format_timestamp(current_time)
        
        # Parse artist and title from filename
        artist, title = parse_filename(filename)
        
        # Add to tracklist
        line = f"{timestamp} {artist} – {title}"
        tracklist_lines.append(line)
        
        # Get duration and add to running time
        duration = get_audio_duration(filepath)
        if duration:
            current_time += duration
        else:
            # Default 3 minutes if can't read
            current_time += 180
            print(f"  Using default duration for: {filename}")
    
    return "\n".join(tracklist_lines)


def main():
    if len(sys.argv) < 2:
        # Default to current directory
        folder = os.getcwd()
    else:
        folder = sys.argv[1]
    
    print(f"Generating tracklist for: {folder}\n")
    print("-" * 50)
    
    tracklist = generate_tracklist(folder)
    
    if tracklist:
        print("\n" + "=" * 50)
        print("COPY THIS TO YOUR YOUTUBE DESCRIPTION:")
        print("=" * 50 + "\n")
        print(tracklist)
        print("\n" + "=" * 50)
        
        # Also save to file
        output_file = os.path.join(folder, "tracklist.txt")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(tracklist)
        print(f"\nAlso saved to: {output_file}")


if __name__ == "__main__":
    main()
