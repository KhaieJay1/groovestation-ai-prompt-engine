"""
BussGroove Prompt Generator - Instrumental Only
Supports: Jazz Lo-Fi Hip-Hop (80%) | Afro Lounge (20%)
Now generates BOTH Style Prompt AND Structure Template for longer songs.
"""

# ============================================
# CATALOG CONFIGURATIONS
# ============================================

JAZZ_LOFI_CONFIG = {
    "name": "Jazz Lo-Fi Hip-Hop",
    "tempo_range": (75, 95),
    "energy_range": (3, 5),
    "keys": ["Am", "Dm", "Em", "Gm", "Cm", "Fmaj7", "Cmaj7"],
    "lead_instruments": [
        "jazzy electric guitar with clean warm tones",
        "warm Rhodes electric piano",
        "soft acoustic piano",
        "mellow saxophone",
        "guitar and Rhodes combo",
    ],
    "required": "boom-bap drums (crisp snare, soft kick, steady hi-hats), deep melodic bassline, vinyl crackle, atmospheric pads",
    "forbidden": "vocals, vocal chops, heavy 808, trap hi-hats, brass, EDM drops, distorted guitars",
    "moods": ["reflective", "calming", "nostalgic", "warm", "cozy", "peaceful", "mellow", "dreamy"],
}

AFRO_LOUNGE_CONFIG = {
    "name": "Afro Lounge Instrumental",
    "tempo_range": (95, 108),  # CORRECTED: was 82-92, now 95-108 per brief
    "energy_range": (4, 6),
    "keys": ["Fm", "Am", "Dm", "Gm", "Em"],  # Minor keys for sophisticated feel
    "lead_instruments": [
        "warm Rhodes electric piano",
        "soft kalimba patterns",
        "gentle marimba phrases",
        "clean muted guitar",
        "soft wooden flute",
        "Rhodes and kalimba combo",
    ],
    "percussion": "soft Afrobeat percussion, shakers, gentle congas",
    "required": "warm rounded bass at low volume, lush atmospheric pads, spacious reverb",
    "forbidden": "vocals, lyrics, vocal chops, horns, brass, trumpet, heavy sub-bass, aggressive drums, festival drops",
    "moods": ["sophisticated", "elegant", "refined", "luxurious", "serene", "graceful", "premium"],
}


def detect_catalog(bpm, energy=5):
    """Automatically detect which catalog fits based on tempo."""
    if bpm <= 95:
        return "jazz_lofi", JAZZ_LOFI_CONFIG
    else:
        return "afro_lounge", AFRO_LOUNGE_CONFIG


def generate_style_prompt(analysis_data):
    """
    Generate BOTH outputs for Suno:
    1. Style Prompt (for Style field)
    2. Structure Template (for Lyrics field - controls song length)
    """
    bpm = analysis_data.get('bpm', 85)
    key = analysis_data.get('key', 'Am')
    energy = analysis_data.get('energy', 5)
    
    catalog_id, config = detect_catalog(bpm, energy)
    
    # Pick appropriate lead instrument based on energy
    if energy <= 3:
        lead = config["lead_instruments"][0]
    elif energy <= 6:
        lead = config["lead_instruments"][1]
    else:
        lead = config["lead_instruments"][2]
    
    # Pick mood words
    mood_words = ", ".join(config["moods"][:4])
    
    # =========================================
    # OUTPUT 1: STYLE PROMPT
    # =========================================
    if catalog_id == "jazz_lofi":
        style_prompt = f"""[Style: Lo-Fi Hip-Hop, Jazz Hop, Chill Instrumental]
[Tempo: {bpm} BPM] [Key: {key}]
[Mood: {mood_words}]

A laid-back lo-fi hip-hop instrumental featuring {lead} with clean, warm tones and subtle reverb. Classic boom-bap drums with a crisp snare, soft kick, and steady closed hi-hats create a relaxed groove. Deep melodic bassline provides foundation. Vinyl crackle and tape warmth throughout. Atmospheric synth pads add depth. Instrumental only, no vocals. Loop-based structure with subtle melodic variations.

[Instruments: {lead}, boom-bap drums, deep bass, vinyl texture, soft synth pad]
[Production: warm analog feel, vintage, slightly compressed, mid-focused mix]
[No vocals, no brass, no drops, no aggressive elements, purely instrumental]"""

        # Structure for longer songs (4-5 minutes)
        structure_template = f"""[Intro]
(Vinyl crackle fades in)
(Soft hi-hats establish rhythm)
(Deep bass enters with warm pulse)
({lead} plays opening melodic phrase)
(Drums build gently - kick and snare join)

[Verse 1]
(Full boom-bap groove established)
(Bass line grooves steadily)
({lead} plays main melodic theme)
(Vinyl texture present throughout)
(Atmospheric pads add depth in background)

[Chorus]
(Melody becomes more prominent)
(Drums slightly more present)
({lead} plays memorable hook melody)
(Bass follows melodic movement)
(Pads swell gently)

[Verse 2]
(Groove continues with subtle variation)
({lead} plays counter-melody)
(Hi-hats add gentle variation)
(Bass maintains steady pocket)
(New melodic phrase introduced)

[Instrumental Break]
({lead} takes melodic solo)
(Drums pull back slightly)
(Bass walks more freely)
(Atmospheric pads expand)
(Vinyl crackle more audible)

[Chorus]
(Full arrangement returns)
(All elements present and balanced)
({lead} reprises hook melody)
(Drums and bass lock in tight)
(Energy peaks gently)

[Bridge]
(Everything drops to minimal elements)
(Just bass and soft {lead})
(Single drum hit accents)
(Space and breathing room)
(Gentle build back)

[Final Chorus]
(Full arrangement with layered textures)
({lead} plays extended melody)
(Drums maintain steady groove)
(Bass holds foundation)
(All elements at peak warmth)

[Outro]
(Elements fade one by one)
({lead} plays final melodic phrase)
(Drums reduce to just hi-hats)
(Bass holds final note)
(Vinyl crackle fades to silence)"""

    else:  # afro_lounge - 100% INSTRUMENTAL (CORRECTED)
        style_prompt = f"""[Style: Afro Lounge, Chill Afrobeat Instrumental, World Music]
[Tempo: {bpm} BPM] [Key: {key}]
[Mood: {mood_words}]

A refined Afro lounge instrumental featuring {lead} creating an elegant atmosphere. Subtle Afrobeat-inspired percussion with soft shakers, gentle congas, and light hi-hats. Warm, rounded bass at low volume provides foundation. Lush atmospheric pads add depth and space. Spacious production with premium polish. Instrumental only, no vocals.

[Instruments: {lead}, soft percussion, warm bass, lush pads]
[Production: spacious, polished, sophisticated, wide stereo, warm analog]
[No vocals, no brass, no heavy bass, no aggressive drums, purely instrumental]"""

        structure_template = f"""[Intro]
(Soft shakers establish gentle rhythm)
(Warm bass enters with Afrobeat pulse)
(Congas add subtle texture)
({lead} plays warm melodic opening)
(Gentle percussion builds slowly)

[Verse 1]
(Shakers lead the groove)
(Bass steady and warm at low volume)
({lead} plays main melodic theme)
(Light hi-hats add shimmer)
(Atmospheric pads underneath)

[Chorus]
(Congas become more present)
({lead} plays memorable melodic phrase)
(Percussion layers dance together)
(Bass follows melodic movement)
(Pads swell gently)

[Instrumental Break]
({lead} takes center with melodic solo)
(Shakers and congas create conversation)
(Bass line grooves deeply)
(Pads expand into space)
(Elegant and flowing)

[Verse 2]
(Same groove continues)
(Percussion layers build gently)
({lead} plays variation on theme)
(New melodic phrase introduced)
(Energy builds subtly)

[Chorus]
(Fuller sound - all elements balanced)
({lead} and percussion interplay)
(Bass maintains warm foundation)
(Pads at full presence)
(Peak elegance)

[Bridge]
(Everything drops to just bass and {lead})
(Single percussion accent)
(Space and breathing)
(Gentle atmospheric swell)
(Percussion builds back)

[Final Chorus]
(Full arrangement returns softly)
(Layered percussion textures)
({lead} plays extended melodic phrase)
(All elements at peak warmth)
(Sophisticated and refined)

[Outro]
(Percussion fades layer by layer)
({lead} plays final melodic phrase)
(Shakers slow to gentle rhythm)
(Bass holds warm note)
(Fade to peaceful silence)"""

    return {
        "catalog": config["name"],
        "style_prompt": style_prompt.strip(),
        "structure_template": structure_template.strip(),
        "detected_bpm": bpm,
        "detected_key": key,
        "recommended_lead": lead,
        "mood_keywords": mood_words,
    }
