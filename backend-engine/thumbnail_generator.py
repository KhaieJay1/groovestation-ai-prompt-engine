"""
BussGroove Thumbnail Generator
Generates YouTube thumbnails with professional text overlays using Pillow (PIL)
"""

from pathlib import Path
import os
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("❌ Pillow library not found. Run: pip install Pillow")
    Image = None

def find_font(font_name, size, weight='normal'):
    """
    Try to find a font file. Checks common locations and falls back to default.
    
    Args:
        font_name: Base font name (e.g., 'inter', 'playfair')
        size: Font size in pixels
        weight: Font weight ('light', 'normal', 'bold', 'black', 'extra bold')
    """
    if Image is None:
        return ImageFont.load_default()
    
    # Map font names and weights to actual Windows font filenames
    font_map = {
        'inter': {
            'light': 'Inter-Light.ttf',
            'normal': 'Inter-Regular.ttf',
            'bold': 'Inter-Bold.ttf',
            'black': 'Inter-Black.ttf',
            'extra bold': 'Inter-ExtraBold.ttf'
        },
        'playfair': {
            'light': 'PlayfairDisplay-Regular.ttf',
            'normal': 'PlayfairDisplay-Regular.ttf',
            'bold': 'PlayfairDisplay-Bold.ttf',
            'black': 'PlayfairDisplay-Black.ttf',
            'extra bold': 'PlayfairDisplay-ExtraBold.ttf'
        },
        'tan ashford': {
            'normal': 'TAN-ASHFORD.otf',
            'bold': 'TAN-ASHFORD-Bold.otf',
            'extra bold': 'TAN-ASHFORD-ExtraBold.otf',
            'black': 'TAN-ASHFORD-Black.otf'
        },
        # User Requested Fonts
        'bauer bodoni': {
            'light': 'BodoniFLF-Roman.ttf', # Fallback to Roman if Light not present
            'normal': 'BodoniFLF-Roman.ttf', 
            'bold': 'BodoniFLF-Bold.ttf',
            'italic': 'BodoniFLF-Italic.ttf',
            'black': 'BodoniFLF-Bold.ttf' # Fallback
        },
        'univers condensed': {
            'light': 'Univers-Condensed.ttf', # Fallback
            'normal': 'Univers-Condensed.ttf',
            'bold': 'Univers-CondensedBold.ttf',
            'black': 'Univers-CondensedBold.ttf'
        },
        'itc edwardian script': {
            'normal': 'ITCEDSCR.TTF' # Windows system font name often
        },
        'georgia pro condensed': {
            'normal': 'GeorgiaPro-Cond.ttf',
            'bold': 'GeorgiaPro-CondBold.ttf'
        },
        'futura': {
            'normal': 'Futura.ttf',
            'medium': 'Futura-Medium.ttf',
            'bold': 'Futura-Bold.ttf'
        },
        'gordita': {
            'normal': 'Gordita-Regular.otf',
            'bold': 'Gordita-Bold.otf',
            'medium': 'Gordita-Medium.otf'
        },
        # Fallback to system fonts
        'arial': {
            'light': 'arial.ttf',
            'normal': 'arial.ttf',
            'bold': 'arialbd.ttf',
            'black': 'ariblk.ttf',
            'extra bold': 'arialbd.ttf'
        },
        'georgia': {
            'light': 'georgia.ttf',
            'normal': 'georgia.ttf',
            'bold': 'georgiab.ttf',
            'black': 'georgiab.ttf',
            'extra bold': 'georgiab.ttf'
        }
    }
    
    # Normalize font name
    font_key = font_name.lower().replace('.ttf', '').replace('.otf', '')
    weight_key = weight.lower()
    
    # Get the font filename
    if font_key in font_map and weight_key in font_map[font_key]:
        font_filename = font_map[font_key][weight_key]
    else:
        font_filename = font_name  # Use as-is if not in map
    
    # Common font locations on Windows
    font_paths = [
        f"fonts/{font_filename}",  # Project local fonts folder (PRIORITY)
        f"C:/Windows/Fonts/{font_filename}",
        font_filename  # Direct path if provided
    ]
    
    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except (IOError, OSError):
            continue
            
    # CRITICAL: Fallback to Arial (Windows System) to keep size correct
    # The default load_default() ignores size!
    try:
        return ImageFont.truetype("arial.ttf", size)
    except:
        pass
    
    # Final Fallback
    print(f"⚠️ Font '{font_filename}' not found, using default (Tiny)")
    return ImageFont.load_default()

def draw_multiline_text(draw, text, x, y, font, color, line_height_multiplier=1.2):
    """
    Draw text with support for newline characters.
    Returns the total height used.
    """
    lines = text.split('\n')
    
    # Calculate line height from font size
    # Get approximate font height using getbbox
    try:
        bbox = draw.textbbox((0, 0), "Ay", font=font)
        font_height = bbox[3] - bbox[1]
    except:
        font_height = font.size if hasattr(font, 'size') else 50
    
    line_height = int(font_height * line_height_multiplier)
    
    current_y = y
    for line in lines:
        draw.text((x, current_y), line, fill=color, font=font)
        current_y += line_height
    
    return current_y - y

def generate_youtube_thumbnail(
    background_image_path: Path,
    output_path: Path,
    line1_text: str = "Afro House Trumpet Grooves",
    line2_text: str = "BussGroove Vol. 01",
    line3_text: str = "Golden\nEvening Mix",
    line1_config: dict = None,
    line2_config: dict = None,
    line3_config: dict = None
):
    """
    Generate a YouTube thumbnail with professional text overlays.
    
    Args:
        background_image_path: Path to background image
        output_path: Where to save the thumbnail
        line1_text: Top subtitle (genre/description)
        line2_text: Middle text (series branding)
        line3_text: Large title (supports \n for multi-line)
        line1_config: Dict with x, y, size, color, weight, font
        line2_config: Dict with x, y, size, color, weight, font
        line3_config: Dict with x, y, size, color, weight, font
    """
    print(f"🎨 Generating YouTube Thumbnail...")
    
    if Image is None:
        return False
    
    WIDTH, HEIGHT = 1920, 1080
    
    # Default configurations (GOLDEN DEFAULTS from Technical Spec)
    default_line1 = {
        'x': 631, 
        'y': 730, 
        'size': 38, 
        'color': '#FFFFFF',  # white
        'weight': 'black',
        'font': 'inter'
    }
    default_line2 = {
        'x': 202, 
        'y': 938, 
        'size': 158, 
        'color': '#FFFFFF',  # white
        'weight': 'bold',
        'font': 'inter'
    }
    default_line3 = {
        'x': 1394, 
        'y': 988, 
        'size': 33, 
        'color': '#FFC107',  # gold
        'weight': 'light',
        'font': 'playfair'
    }
    
    # Merge with provided configs
    line1 = {**default_line1, **(line1_config or {})}
    line2 = {**default_line2, **(line2_config or {})}
    line3 = {**default_line3, **(line3_config or {})}

    # Validation & Typing Fix (Ensure sizes/coords are INT)
    for cfg in [line1, line2, line3]:
        cfg['x'] = int(cfg['x'])
        cfg['y'] = int(cfg['y'])
        cfg['size'] = int(cfg['size'])
    
    # Load background image
    if background_image_path and background_image_path.exists():
        img = Image.open(background_image_path).convert("RGB")
        img = img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    else:
        print("❌ Background image not found")
        return False
    
    draw = ImageDraw.Draw(img)
    
    # Load fonts with weight support
    font1 = find_font(line1['font'], line1['size'], line1.get('weight', 'normal'))
    font2 = find_font(line2['font'], line2['size'], line2.get('weight', 'normal'))
    font3 = find_font(line3['font'], line3['size'], line3.get('weight', 'normal'))
    
    # Convert hex colors to RGB tuples
    def hex_to_rgb(hex_color):
        if not hex_color or not isinstance(hex_color, str):
            print(f"⚠️ Invalid color '{hex_color}', defaulting to White")
            return (255, 255, 255)
            
        hex_color = hex_color.lstrip('#')
        
        # Handle 3-digit hex (e.g. #FFF)
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
            
        try:
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        except Exception as e:
            print(f"⚠️ Color parse error '{hex_color}': {e}. Defaulting to White")
            return (255, 255, 255)
    
    color1 = hex_to_rgb(line1['color'])
    color2 = hex_to_rgb(line2['color'])
    color3 = hex_to_rgb(line3['color'])
    
    # Draw text layers
    # CRITICAL FIX: HTML Canvas uses Baseline (bottom of text) for Y by default/convention in many design tools?
    # actually HTML default is alphabetic baseline.
    # The user's coordinates (Y=938) for a 158px font imply they expect the text to sit ON that line or Start at that line?
    # If Y=938 is top-left, 938+158 = 1096, which is off screen (height 1080).
    # THIS CONFIRMS: The user's Y coordinate is likely the BASELINE or BOTTOM.
    # We will try anchor='ls' (Left, Baseline) or 'lb' (Left, Bottom).
    
    # Let's try 'ls' (Left, Baseline) which is standard for matching typography.
    # We also need to ensure the fallback font supports it.
    
    try:
        # Draw Line 1 (Multiline Support with Baseline Anchor)
        current_y_l1 = line1['y']
        for i, line in enumerate(line1_text.split('\n')):
            # First line uses the anchor Y (Baseline). Subsequent lines drop down.
            # Note: For subsequent lines, 'ls' (Left Baseline) still works if we adjust Y to the NEXT baseline.
            draw.text((line1['x'], current_y_l1), line, fill=color1, font=font1, anchor='ls')
            current_y_l1 += line1['size'] * 1.2 # 1.2 line height

        # Draw Line 2 (Multiline Support with Baseline Anchor)
        current_y_l2 = line2['y']
        for i, line in enumerate(line2_text.split('\n')):
            draw.text((line2['x'], current_y_l2), line, fill=color2, font=font2, anchor='ls')
            current_y_l2 += line2['size'] * 1.2

        # Line 3 (Already uses custom helper, but let's standardize if needed or keep as is)
        # Keeping existing helper for Line 3 as it might rely on Top-Left logic (it uses draw_multiline_text helper)
        draw_multiline_text(draw, line3_text, line3['x'], line3['y'], font3, color3) 
        
    except Exception as e:
        print(f"⚠️ Anchor error (Old Pillow?): {e}. Fallback to offset.")
        # Fallback logic simplified for safety
        draw.text((line1['x'], line1['y'] - line1['size']), line1_text, fill=color1, font=font1)
        draw.text((line2['x'], line2['y'] - line2['size']), line2_text, fill=color2, font=font2)
        draw_multiline_text(draw, line3_text, line3['x'], line3['y'], font3, color3)
    
    # Save
    img.save(output_path, quality=95)
    print(f"✅ YouTube Thumbnail Saved: {output_path.name}")
    return True

def generate_local_thumbnail(title: str, output_path: Path, background_image_path: Path = None):
    """
    Generates a CLEAN thumbnail locally (for video background - NO TEXT).
    This is kept for backward compatibility but isn't used for YouTube thumbnails.
    """
    print(f"🎨 Generating Clean Thumbnail: {title}")
    
    if Image is None:
        return False
        
    WIDTH, HEIGHT = 1920, 1080
    
    # Just resize the background image, no text
    if background_image_path and background_image_path.exists():
        img = Image.open(background_image_path).convert("RGB")
        img = img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    else:
        # Default gradient background if no image
        img = Image.new('RGB', (WIDTH, HEIGHT), color=(20, 20, 30))
    
    # Save without any text overlays
    img.save(output_path, quality=95)
    print(f"✅ Clean Thumbnail Saved: {output_path.name}")
    return True
