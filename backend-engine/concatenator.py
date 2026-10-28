import os
import subprocess
from pathlib import Path

def concatenate_tracks(file_list, output_path):
    """
    Concatenates a list of audio files into a single file using FFmpeg's concat demuxer.
    
    Args:
        file_list (list): List of Path objects or strings to audio files
        output_path (Path or str): Destination path for the result
    
    Returns:
        bool: True if successful, False otherwise
    """
    if not file_list:
        print("❌ No files to concatenate")
        return False
        
    try:
        # Create a temporary input list file for FFmpeg
        # The syntax is: file 'path/to/file'
        temp_list_path = output_path.parent / "temp_concat_list.txt"
        
        with open(temp_list_path, 'w', encoding='utf-8') as f:
            for file_path in file_list:
                # Use absolute paths with forward slashes for FFmpeg
                abs_path = Path(file_path).resolve()
                safe_path = str(abs_path).replace('\\', '/').replace("'", "'\\''")
                f.write(f"file '{safe_path}'\n")
        
        print(f"📄 Created mix list with {len(file_list)} tracks")
        
        # Run FFmpeg Concat Demuxer
        # -f concat: input format is concat
        # -safe 0: allow unsafe paths (required for absolute paths)
        # -i temp_list_path: input file
        # -c copy: stream copy (no re-encoding, extremely fast)
        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', str(temp_list_path),
            '-c', 'copy',
            str(output_path)
        ]
        
        # We suppress output unless error
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Cleanup
        if temp_list_path.exists():
            os.remove(temp_list_path)
            
        print(f"✅ Separated tracks successfully joined into: {output_path.name}")
        return True
        
    except subprocess.CalledProcessError as e:
        err_msg = e.stderr.decode()
        print(f"❌ FFmpeg Error: {err_msg}")
        raise Exception(f"FFmpeg Error: {err_msg}")
    except Exception as e:
        print(f"❌ Concatenation Error: {e}")
        raise e

# Simple test if run directly
if __name__ == "__main__":
    # Test stub
    pass
