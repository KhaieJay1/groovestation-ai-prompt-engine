
import os
import shutil
import logging
import yaml
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

class WorkflowManager:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.prompts_file = self.root_dir / "prompts.yaml"
        self.music_dir = self.root_dir / "Music_Songs"
        self.inbox_dir = self.root_dir / "Inbox"
        
        # Ensure Inbox Exists
        self.inbox_dir.mkdir(exist_ok=True)
        
        self.config = self._load_config()

    def _load_config(self):
        if not self.prompts_file.exists():
            return {'genres': {}}
        with open(self.prompts_file, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {'genres': {}}

    def _save_config(self):
        with open(self.prompts_file, 'w', encoding='utf-8') as f:
            yaml.dump(self.config, f, sort_keys=False, allow_unicode=True)

    def get_planner_state(self):
        """Returns the current state of all Vibes for the UI."""
        state = {}
        for genre, data in self.config.get('genres', {}).items():
            # Calculate Next Volume
            last_vol = data.get('last_volume', 0)
            next_vol = last_vol + 1
            
            # Count Songs in current "Planning" bin if we had one (Future feature)
            # For now, just return the static data
            state[genre] = {
                'name': genre,
                'next_vol': next_vol,
                'prompt': data.get('prompt', "No prompt saved."),
                'status': data.get('status', 'Planning'), # Planning, Generating, Ready
                'last_updated': data.get('last_updated', str(datetime.now().date()))
            }
        return state

    def update_vibe_status(self, genre, status, next_vol=None):
        """Updates the status or volume of a vibe."""
        if genre not in self.config['genres']:
            return False, "Invalid Genre"
        
        if status:
            self.config['genres'][genre]['status'] = status
        
        if next_vol is not None:
             self.config['genres'][genre]['last_volume'] = int(next_vol) - 1
             
        self.config['genres'][genre]['last_updated'] = str(datetime.now().date())
        self._save_config()
        return True, "Updated"

    def generate_next_title(self, genre):
        """Generates the full title string for the next volume."""
        data = self.config['genres'].get(genre)
        if not data: return "Unknown Genre"
        
        vol = data.get('last_volume', 0) + 1
        vol_str = str(vol).zfill(2)
        
        # Custom Logic: Pick a random catchy title from the list
        titles = data.get('song_titles', [])
        import random
        catchy_title = random.choice(titles) if titles else getattr(self, 'last_title_fallback', f"{genre} Mix")
        
        # Format: Catchy Title Vol. XX | BussGroove
        return f"{catchy_title} Vol. {vol_str} | BussGroove"

    def generate_prompt_variations(self, genre, count=12):
        """
        Generates 'count' prompt variations for batch Suno generation.
        Uses tempo_variations, key_variations, and lead_variations from prompts.yaml.
        Now includes structure templates for longer songs (4-5 minutes).
        """
        data = self.config['genres'].get(genre)
        if not data:
            return []
        
        base_prompt = data.get('prompt', '')
        tempo_vars = data.get('tempo_variations', [85] * count)
        key_vars = data.get('key_variations', ['Am'] * count)
        lead_vars = data.get('lead_variations', ['guitar'] * count)
        song_titles = data.get('song_titles', [f"Track {i+1}" for i in range(count)])
        catalog = data.get('catalog', 'jazz-lofi')
        
        variations = []
        for i in range(count):
            tempo = tempo_vars[i % len(tempo_vars)]
            key = key_vars[i % len(key_vars)]
            lead = lead_vars[i % len(lead_vars)]
            
            # Use song_titles if available, otherwise generic
            if i < len(song_titles):
                title = song_titles[i]
            else:
                title = f"Track {i + 1}"
            
            # Replace placeholders in prompt or append variations
            var_prompt = base_prompt
            # Update BPM if mentioned
            if 'BPM' in var_prompt:
                import re
                var_prompt = re.sub(r'\d+ BPM', f'{tempo} BPM', var_prompt)
            else:
                var_prompt += f", {tempo} BPM"
            
            # Update Key if mentioned
            if any(k in var_prompt for k in ['Am', 'Dm', 'Em', 'Gm', 'Cm', 'Fm', 'Fmaj7', 'Cmaj7']):
                for old_key in ['Am', 'Dm', 'Em', 'Gm', 'Cm', 'Fm', 'Fmaj7', 'Cmaj7']:
                    if old_key in var_prompt:
                        var_prompt = var_prompt.replace(old_key, key, 1)
                        break
            else:
                var_prompt += f", {key}"
            
            # Generate structure template for longer songs (4-5 min)
            if 'afro' in catalog.lower():
                structure = self._generate_afro_structure(lead)
            else:
                structure = self._generate_lofi_structure(lead)
            
            variations.append({
                'index': i + 1,
                'title': title,
                'prompt': var_prompt,        # Style prompt (for Suno "Style of Music")
                'structure': structure,       # Structure template (for Suno "Lyrics")
                'tempo': tempo,
                'key': key,
                'lead': lead
            })
        
        return variations
    
    def _generate_lofi_structure(self, lead):
        """Generate structure template for Jazz Lo-Fi (instrumental)"""
        return f"""[Intro]
(Vinyl crackle fades in)
(Soft hi-hats establish rhythm)
({lead} plays opening melodic phrase)
(Drums build gently)

[Verse 1]
(Full boom-bap groove established)
({lead} plays main melodic theme)
(Bass line grooves steadily)
(Atmospheric pads in background)

[Chorus]
(Melody becomes more prominent)
({lead} plays memorable hook)
(All elements present)

[Verse 2]
(Groove continues with variation)
({lead} plays counter-melody)
(New melodic phrase introduced)

[Instrumental Break]
({lead} takes melodic solo)
(Drums pull back slightly)
(Bass walks freely)

[Chorus]
(Full arrangement returns)
({lead} reprises hook melody)
(Energy peaks gently)

[Outro]
(Elements fade one by one)
({lead} plays final phrase)
(Vinyl crackle fades to silence)"""

    def _generate_afro_structure(self, lead):
        """Generate structure template for Afro Lounge (instrumental)"""
        return f"""[Intro]
(Soft shakers establish rhythm)
(Warm bass enters with pulse)
({lead} plays warm melodic opening)
(Percussion builds slowly)

[Verse 1]
(Shakers lead the groove)
({lead} plays main melodic theme)
(Bass steady and warm)
(Atmospheric pads underneath)

[Chorus]
(Congas become more present)
({lead} plays memorable melodic phrase)
(Percussion layers dance together)

[Instrumental Break]
({lead} takes center with melodic solo)
(Shakers and congas create conversation)
(Pads expand into space)

[Verse 2]
(Same groove continues)
({lead} plays variation on theme)
(Energy builds subtly)

[Chorus]
(Fuller sound - all elements balanced)
({lead} and percussion interplay)
(Peak elegance)

[Outro]
(Percussion fades layer by layer)
({lead} plays final melodic phrase)
(Fade to peaceful silence)"""

    def ingest_folder(self, source_folder, target_genre, specific_vol=None):
        """
        Takes a folder of ~20 songs and installs it as the next Mix for that Genre.
        """
        source_path = Path(source_folder)
        if not source_path.exists():
            return False, "Source folder not found"

        # Validate Audio Files
        valid_exts = {'.mp3', '.wav'}
        songs = [f for f in source_path.iterdir() if f.suffix.lower() in valid_exts]
        
        if len(songs) < 1:
            return False, "No songs found in folder"
            
        # Determine Target Path
        # .../Music_Songs/Genre/Mix X
        genre_dir = self.music_dir / target_genre
        genre_dir.mkdir(exist_ok=True)
        
        if specific_vol:
            mix_name = f"Mix {specific_vol}"
        else:
            # Auto-detect next unused Mix folder
            existing = [d for d in genre_dir.iterdir() if d.is_dir() and d.name.startswith("Mix")]
            mix_name = f"Mix {len(existing) + 1}"
            
        target_mix_dir = genre_dir / mix_name
        
        if target_mix_dir.exists():
             return False, f"Target {mix_name} already exists! Rename or choose next."
        
        # Copy/Move Logic
        try:
            shutil.move(str(source_path), str(target_mix_dir))
            
            # Update Config
            # If we just ingested Vol 5, set last_volume to 5
            # Update Config
            # Always update last_volume to the current mix number we just created
            new_vol = int(specific_vol) if specific_vol else (len(existing) + 1)
            
            # Only update if this new volume is greater than what we had (prevent regression if re-ingesting old mixes)
            if new_vol > self.config['genres'][target_genre].get('last_volume', 0):
                self.config['genres'][target_genre]['last_volume'] = new_vol
                self._save_config()
                 
            return True, f"Successfully imported to {target_mix_dir}"
        except Exception as e:
            return False, str(e)
    def generate_next_title(self, genre):
        """Generates a formatted title for the next mix/video."""
        data = self.config['genres'].get(genre, {})
        next_vol = data.get('last_volume', 0) + 1
        return f"{genre} Mix | Vol. {next_vol:02} | BussGroove YouTube"

    def update_vibe_status(self, genre, status=None, next_vol=None):
        if genre not in self.config['genres']:
            return False, "Genre not found"
        if status:
            self.config['genres'][genre]['status'] = status
        if next_vol:
            self.config['genres'][genre]['last_volume'] = int(next_vol) - 1
        self._save_config()
        return True, "Updated"
