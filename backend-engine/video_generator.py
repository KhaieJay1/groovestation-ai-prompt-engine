"""
BussGroove Video Generator
Creates music videos with audio frequency visualizations using FFmpeg
"""

import os # Added
import subprocess
from pathlib import Path

def create_visualization_video(audio_path: Path, image_path: Path, output_path: Path) -> bool:
    """
    Create a video with an audio equalizer visualization overlay.
    """
    print(f"🎬 Creating Video for: {audio_path.name}")

    if not audio_path.exists():
        print(f"❌ Audio file not found: {audio_path}")
        return False

    if not image_path.exists():
        print(f"❌ Image file not found: {image_path}")
        return False

    # Resolution settings
    WIDTH = 1920
    HEIGHT = 1080
    
    # Simple waveform visualizer
    # [0:v] is image, [1:a] is audio
    # scale image to 1920x1080 (crop if needed)
    
    ffmpeg_command = [
        "ffmpeg",
        "-loop", "1",
        "-i", str(image_path),
        "-i", str(audio_path),
        "-filter_complex",
        (
            f"[0:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,crop={WIDTH}:{HEIGHT}[bg];"
            "[1:a]showfreqs="
            "mode=bar:"
            "fscale=log:"
            "colors=white|white:" # Dual channel colors
            "win_size=2048,"
            "format=rgba,"
            f"scale={WIDTH/2}:140[eq];" # Scale freq visualizer
            f"[bg][eq]overlay=(W-w)/2:H-h-100" # Overlay at bottom center
        ),
        "-map", "0:v",   # Map processed video
        "-map", "1:a",   # Map audio
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-c:a", "aac",  # Transcode to AAC for MP4 compatibility
        "-b:a", "320k", # High quality audio
        "-shortest",     # Finish when audio ends
        "-movflags", "+faststart",
        "-y",
        str(output_path)
    ]

    try:
        # Run with capture_output to keep console clean, print stderr on error
        subprocess.run(
            ffmpeg_command,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ Video Created: {output_path.name}")
        return True

    except subprocess.CalledProcessError as e:
        print("❌ FFmpeg error:")
        print(e.stderr)
        return False

    except FileNotFoundError:
        print("❌ FFmpeg not found. Install it and add to PATH.")
        return False

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def create_static_video(audio_path: Path, image_path: Path, output_path: Path, sub_text: str = "BUSSGROOVE", main_text: str = "Sunday Morning", center_text: str = "", branding_config: dict = None) -> bool:
    """
    Create a video with static background + Center Visualizer + Intro + Center Perm Text + Bottom Titles.
    Supports dynamic branding via branding_config.
    """
    # DEFAULTS (BussGroove Standard)
    brand_name = "BussGroove"
    color_primary = "#FFC107" # Gold
    intro_1 = "BUSSGROOVE PRESENTS"
    intro_2 = "MUSIC IS HERE FOR YOU"
    intro_3 = "LIKE | COMMENT | SUBSCRIBE"
    
    # OVERRIDES
    if branding_config:
        brand_name = branding_config.get("brand_name", brand_name)
        color_primary = branding_config.get("brand_color_primary", color_primary)
        intros = branding_config.get("intro_sequences", [])
        if len(intros) >= 3:
            intro_1 = intros[0]
            intro_2 = intros[1]
            intro_3 = intros[2]

    print(f"🎬 Creating Visualizer Video for: {audio_path.name}")
    print(f"   • Brand:  {brand_name}")
    print(f"   • Main:   {main_text}")
    print(f"   • Sub:    {sub_text}")
    print(f"   • Center: {center_text}")
    
    if not audio_path.exists() or not image_path.exists():
        return False
        
    WIDTH, HEIGHT = 1920, 1080
    
    # Helper to find safe font path
    def get_safe_font(font_names):
        """Try to find a valid font path from a list of possibilities."""
        potential_paths = [
            Path(r"C:\Windows\Fonts"),
            Path(os.path.expanduser("~\\AppData\\Local\\Microsoft\\Windows\\Fonts"))
        ]
        
        for fname in font_names:
            for parent in potential_paths:
                fpath = parent / fname
                if fpath.exists():
                    return fpath
        
        return None

    # Resolve Fonts (Default to Arial Bold/BussGroove Style)
    # Could imply dynamic font loading here later if needed
    font_title = get_safe_font(["arialbd.ttf", "arial.ttf"]) 
    font_body = get_safe_font(["arialbd.ttf", "arial.ttf"])
    
    # Format for FFmpeg filter (escape drive colon)
    def fmt_font(path):
        if not path: return "sans-serif"
        clean = str(path).replace("\\", "/")
        return clean.replace(":", "\\:")

    f_title_str = fmt_font(font_title)
    f_body_str = fmt_font(font_body)
    
    cmd = [
        "ffmpeg",
        "-y",
        "-loop", "1",
        "-i", str(image_path),
        "-i", str(audio_path),
        "-filter_complex",
        (
            f"[0:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,crop={WIDTH}:{HEIGHT},setsar=1[bg];"
            
            # Equalizer (Larger & Widescreen)
            f"[1:a]showfreqs=mode=bar:ascale=sqrt:fscale=log:win_size=1024:"
            f"colors={color_primary}|#9C27B0|#00BCD4:"
            "s=1280x120[viz];"
            
            # Overlay Equalizer at Bottom (Y=960) - Adjusted to H-h-20
            f"[bg][viz]overlay=(W-w)/2:H-h-20[v1];"
            
            # --- INTRO SEQUENCE (Extended - 40s Total) ---
            # 1. INTRO 1 (0-7s) (e.g. BUSSGROOVE PRESENTS)
            f"[v1]drawtext=text='{intro_1}':fontfile='{f_body_str}':"
            f"fontsize=80:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:"
            f"shadowcolor=black:shadowx=2:shadowy=2:alpha='if(lt(t,1),t/1,if(lt(t,6),1,if(lt(t,7),(7-t)/1,0)))':enable='between(t,0,7)'[v2];"
            
            # 2. INTRO 2 (10-17s) (e.g. MUSIC IS HERE FOR YOU)
            f"[v2]drawtext=text='{intro_2}':fontfile='{f_body_str}':"
            f"fontsize=80:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:"
            f"shadowcolor=black:shadowx=2:shadowy=2:alpha='if(lt(t-10,1),(t-10)/1,if(lt(t-10,6),1,if(lt(t-10,7),(7-(t-10))/1,0)))':enable='between(t,10,17)'[v3];"
            
            # 3. INTRO 3 (21-38s) (e.g. LIKE | COMMENT | SUBSCRIBE)
            f"[v3]drawtext=text='{intro_3}':fontfile='{f_body_str}':"
            f"fontsize=80:fontcolor={color_primary}:x=(w-text_w)/2:y=(h-text_h)/2:"
            f"shadowcolor=black:shadowx=2:shadowy=2:alpha='if(lt(t-21,1),(t-21)/1,if(lt(t-21,16),1,if(lt(t-21,17),(17-(t-21))/1,0)))':enable='between(t,21,38)'[v4];"
            
            # --- PERMANENT TITLES (Starts at 40s - Fade In) ---
            
            # 4. CENTER TEXT (Collection Name) - Permanent - WHITE COLOR - Arial Bold
            f"[v4]drawtext=text='{center_text}':fontfile='{f_body_str}':"
            f"fontsize=80:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:"
            f"shadowcolor=black:shadowx=2:shadowy=2:alpha='if(lt(t-40,1),(t-40)/1,1)':enable='gte(t,40)'[v5];"
            
            # 5. Subtitle (Brand Primary Color) - Genre Name (Size 20 - Smaller) - Bottom Right - Arial Bold
            f"[v5]drawtext=text='{sub_text}':fontfile='{f_body_str}':"
            f"fontsize=20:fontcolor={color_primary}:x=1300:y=930:"
            f"shadowcolor=black:shadowx=1:shadowy=1:alpha='if(lt(t-40,1),(t-40)/1,1)':enable='gte(t,40)'[v6];"
            
            # 6. Main Text (White) - BRAND NAME (e.g. BussGroove)
            f"[v6]drawtext=text='{brand_name}':fontfile='{f_body_str}':"
            f"fontsize=70:fontcolor=white:x=1300:y=950:"
            f"shadowcolor=black:shadowx=2:shadowy=2:alpha='if(lt(t-40,1),(t-40)/1,1)':enable='gte(t,40)'"
        ),
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-r", "24", 
        "-c:a", "aac",
        "-b:a", "320k",
        "-shortest",
        "-movflags", "+faststart",
        str(output_path)
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ Visualizer Video Created: {output_path.name}")
        return True
    except subprocess.CalledProcessError as e:
        print("❌ FFmpeg error:", e.stderr)
        return False

# --- REFINED GENERATOR (Final Design: Compact Viz, Clean Text, No Logo/Intro) ---
def create_refined_video(tracks: list, background_image: Path, output_file: Path) -> bool:
    """
    Generates a refined video with:
    1. Static Background (1080p).
    2. Compact Visualizer (Bottom Center).
    3. Clean Text Overlays (Unified Font).
    4. NO Logo Overlay, NO Audio Intro.
    """
    print(f"🎬 Creating Refined Video for {len(tracks)} tracks...")
    
    cmd_args = ["ffmpeg", "-y"]
    
    # 1. Background Input (0)
    cmd_args.extend(["-loop", "1", "-i", str(background_image)])
    
    # 2. Audio Inputs
    input_counter = 1
    valid_tracks = []
    
    for t in tracks:
        p = Path(t['path'])
        if not p.exists():
            print(f"⚠️ Track missing: {p}")
            continue
        valid_tracks.append(t)
        cmd_args.extend(["-i", str(p)])
        
    if not valid_tracks:
        print("❌ No valid tracks to render.")
        return False
        
    track_input_start = input_counter 
    
    # 3. Filter Complex Construction
    complex_filter_parts = []
    concat_segments = []
    
    # Simple formatting for all tracks (No mixing magic needed)
    for i, track in enumerate(valid_tracks):
        current_input_idx = track_input_start + i
        lbl = f"[fmt_{current_input_idx}]"
        complex_filter_parts.append(f"[{current_input_idx}:a]aformat=sample_rates=44100:channel_layouts=stereo{lbl}")
        concat_segments.append(lbl)
            
    # Concat Audio
    concat_inputs = "".join(concat_segments)
    
    # [a_body_pre] -> [a_out] + [a_viz]
    complex_filter_parts.append(f"{concat_inputs}concat=n={len(concat_segments)}:v=0:a=1[a_body_pre]")
    complex_filter_parts.append(f"[a_body_pre]asplit=2[a_out][a_viz]")
    
    # 4. Visual Selection & Viz
    WIDTH = 1920
    HEIGHT = 1080
    
    # Background Processing: Scale/Crop/Brighten
    complex_filter_parts.append(f"[0:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,crop={WIDTH}:{HEIGHT},setsar=1,eq=brightness=0.1:saturation=1.2[bg_scaled]")
    
    # Visualizer: Shorter Width (800x60)
    # Colors: Gold|Purple|Teal
    complex_filter_parts.append(
        f"[a_viz]showfreqs=mode=bar:ascale=sqrt:fscale=log:win_size=1024:"
        f"colors=#FFC107|#9C27B0|#00BCD4:"
        f"s=800x60[viz]"
    )
    
    # Overlay Viz: Bottom Center.
    # y = 1080 - 60 - 40 = 980 (Compact)
    complex_filter_parts.append(f"[bg_scaled][viz]overlay=(W-w)/2:980[v_viz]")

    # 5. Text Overlays
    # Unified Fonts: Arial / Arial Bold
    font_std = "arial.ttf" 
    font_bold = "arialbd.ttf"
    if Path("C:/Windows/Fonts/arial.ttf").exists(): font_std = "C\\:/Windows/Fonts/arial.ttf"
    if Path("C:/Windows/Fonts/arialbd.ttf").exists(): font_bold = "C\\:/Windows/Fonts/arialbd.ttf"

    video_filters = []
    current_video_label = "[v_viz]"
    cumulative_duration = 0
    track_counter = 0
    
    # Global Brand
    global_brand = "BussGroove"
    esc_brand = global_brand # Simple safe
    
    # Escape function
    def esc(s): 
        if not s: return ""
        return str(s).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")

    for i, track in enumerate(valid_tracks):
        start_time = cumulative_duration
        if 'duration' not in track: track['duration'] = 180.0
        duration = float(track['duration'])
        end_time = start_time + duration
        cumulative_duration = end_time
        track_counter += 1
        
        # Track Info (Fade In 0s -> Hold -> Fade Out 5s)
        # Position: Top Right (Compact) or Bottom?
        # User: "Make everything compact together... bottom elements"
        # Let's put Track Info right above the visualizer on the RIGHT side.
        # Viz is at 980. Let's put text at 940.
        
        title_text = esc(track.get('title', 'Unknown'))
        disp_text = f"TRACK {track_counter}/{len(valid_tracks)}  |  {title_text}"
        
        # LOGIC:
        # If Track 1 (i==0):
        #   [prev] -> Track Title -> [v_t0_pre] -> Intro Seq -> [v1]
        # If Track > 1:
        #   [prev] -> Track Title -> [vN]
        
        lbl_step = f"[v{track_counter}]"
        
        if i == 0:
            track_title_out_lbl = f"[v_t{i}_pre]"
        else:
            track_title_out_lbl = lbl_step
            
        dt_track = (
            f"{current_video_label}drawtext=fontfile='{font_std}':"
            f"text='{disp_text}':"
            f"fontcolor=gold:fontsize=28:"
            f"shadowcolor=black:shadowx=2:shadowy=2:"
            f"x=w-text_w-60:y=900:" 
            f"enable='between(t\\,{start_time}\\,{start_time+30})':" 
            f"alpha='if(lt(t-{start_time},1),(t-{start_time})/1,if(lt(t-{start_time},29),1,if(lt(t-{start_time},30),(30-(t-{start_time}))/1,0)))'"
            f"{track_title_out_lbl}"
        )
        video_filters.append(dt_track)
        
        if i == 0:
            # --- INTRO TEXT SEQUENCE (Centered) ---
            # 1. BUSSGROOVE PRESENTS (0s - 5s)
            dt_intro1 = (
                f"{track_title_out_lbl}drawtext=fontfile='{font_bold}':"
                f"text='BUSSGROOVE PRESENTS':"
                f"fontcolor=white:fontsize=80:"
                f"shadowcolor=black:shadowx=3:shadowy=3:"
                f"x=(w-text_w)/2:y=(h-text_h)/2:" # Center
                f"enable='between(t\\,{start_time}\\,{start_time+5})':"
                f"alpha='if(lt(t-{start_time},1),(t-{start_time})/1,if(lt(t-{start_time},4),1,if(lt(t-{start_time},5),(5-(t-{start_time}))/1,0)))'"
                f"[v_intro1]"
            )
            video_filters.append(dt_intro1)

            # 2. LET THE GROOVE MOVE YOU. (5s - 10s)
            start_2 = start_time + 5
            dt_intro2 = (
                f"[v_intro1]drawtext=fontfile='{font_bold}':"
                f"text='LET THE GROOVE MOVE YOU.':"
                f"fontcolor=white:fontsize=80:"
                f"shadowcolor=black:shadowx=3:shadowy=3:"
                f"x=(w-text_w)/2:y=(h-text_h)/2:" # Center
                f"enable='between(t\\,{start_2}\\,{start_2+5})':"
                f"alpha='if(lt(t-{start_2},1),(t-{start_2})/1,if(lt(t-{start_2},4),1,if(lt(t-{start_2},5),(5-(t-{start_2}))/1,0)))'"
                f"[v_intro2]"
            )
            video_filters.append(dt_intro2)

            # 3. LIKE | COMMENT | SUBSCRIBE (10s - 18s)
            start_3 = start_time + 10
            dt_intro3 = (
                f"[v_intro2]drawtext=fontfile='{font_bold}':"
                f"text='LIKE | COMMENT | SUBSCRIBE':"
                f"fontcolor=#FFD700:fontsize=80:" 
                f"shadowcolor=black:shadowx=3:shadowy=3:"
                f"x=(w-text_w)/2:y=(h-text_h)/2:" 
                f"enable='between(t\\,{start_3}\\,{start_3+8})':"
                f"alpha='if(lt(t-{start_3},1),(t-{start_3})/1,if(lt(t-{start_3},7),1,if(lt(t-{start_3},8),(8-(t-{start_3}))/1,0)))'"
                f"{lbl_step}" # Outputs [v1]
            )
            video_filters.append(dt_intro3)
        
        current_video_label = lbl_step
        
    # Static Brand: BussGroove (Bottom Right, Below Viz?)
    final_lbl = "[vout]"
    dt_brand = (
        f"{current_video_label}drawtext=fontfile='{font_bold}':"
        f"text='{esc_brand}':"
        f"fontcolor=white:fontsize=48:"
        f"shadowcolor=black:shadowx=2:shadowy=2:"
        f"x=w-text_w-60:y=1000:" # Right Aligned, Below Viz
        f"{final_lbl}"
    )
    video_filters.append(dt_brand)
    
    full_filter_str = ";".join(complex_filter_parts + video_filters)
    
    cmd_args.extend(["-filter_complex", full_filter_str])
    cmd_args.extend(["-map", final_lbl, "-map", "[a_out]"])
    cmd_args.extend(["-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p"])
    cmd_args.extend(["-shortest", str(output_file)])
    
    try:
        subprocess.run(cmd_args, check=True, capture_output=True, text=True)
        print(f"✅ Refined Mix Created: {output_file.name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ FFmpeg Error: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
