"""BussGroove Audio Processor: Handles audio normalization and preparation."""
import os
import subprocess
from pathlib import Path

def process_audio(input_path: Path, output_path: Path):
    """
    Normalizes audio loudness and converts to consistent format.
    Wraps 'ffmpeg-normalize' or basic ffmpeg commands.
    """
    print(f"🎵 Processing Audio: {input_path.name}")
    
    # 1. Check if input exists
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
        
    # 2. Construct FFmpeg command for Normalization + Conversion
    # We will use simple peak normalization to -1dB and convert to 320k mp3 for now
    # Ideally use 'ffmpeg-normalize' package if available, but raw ffmpeg is safer for portable scripts
    
    # Using 'loudnorm' filter for EBU R128 loudness normalization which is YouTube standard
    ffmpeg_command = [
        'ffmpeg',
        '-i', str(input_path),
        '-af', 'loudnorm=I=-14:LRA=11:TP=-1', 
        '-c:a', 'libmp3lame',
        '-b:a', '320k',
        '-ar', '44100',
        '-y',
        str(output_path)
    ]
    
    try:
        subprocess.run(ffmpeg_command, check=True, capture_output=True)
        print(f"   ✅ Audio Processed: {output_path.name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ FFmpeg Error processing audio: {e}")
        # print(e.stderr) # Uncomment for debug
        return False
