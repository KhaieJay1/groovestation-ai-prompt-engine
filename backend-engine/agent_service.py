
import requests
import json
import re
import random
import logging

logger = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"

class SmartSunoGenerator:
    def __init__(self, genre_data):
        """
        genre_data: Dict from prompts.yaml (e.g. {'Soul Jazz': {...}})
        """
        self.genre_data = genre_data
        
        # Mapping existing catalog tags to our new rigid AI rules
        self.catalog_rules = {
            "Jazz": {
                "style_name": "jazz_lofi",
                "bpm_range": (70, 95),
                "allowed_leads": ["guitar", "rhodes", "piano", "saxophone", "trumpet"],
                "drums": "boom-bap (crisp snare, soft kick, steady hi-hats)",
                "forbidden": ["vocals", "lyrics", "808 bass", "EDM", "drops", "heavy distortion", "singing"]
            },
            "Lounge": {
                "style_name": "afro_lounge",
                "bpm_range": (94, 115),
                "allowed_leads": ["kalimba", "marimba", "rhodes", "flute", "nylon guitar", "piano"],
                "drums": "soft afrobeat percussion (shakers, gentle congas, house groove)",
                "forbidden": ["vocals", "lyrics", "heavy bass", "aggressive drums", "singing", "choir"]
            }
        }

    def _get_rules_for_genre(self, genre_name):
        """Find the correct rule set based on the genre's catalog_tag in prompts.yaml."""
        genre_config = self.genre_data.get(genre_name, {})
        catalog_tag = genre_config.get('catalog_tag', 'Jazz') # Default to Jazz if missing
        
        # Fallback if catalog tag isn't in our strict list
        if catalog_tag not in self.catalog_rules:
            # Try to guess based on name
            if "House" in genre_name or "Lounge" in genre_name:
                return self.catalog_rules["Lounge"]
            return self.catalog_rules["Jazz"]
            
        return self.catalog_rules[catalog_tag]

    def generate_batch(self, genre_name, count=10):
        """Generate a batch of unique prompts for a specific genre."""
        if genre_name not in self.genre_data:
            return {'error': f"Genre '{genre_name}' not found in configuration."}
            
        rules = self._get_rules_for_genre(genre_name)
        genre_config = self.genre_data[genre_name]
        base_prompt_text = genre_config.get('prompt', '')
        
        results = []
        
        # We generate 5 at a time to save context/time, or 1 by 1? 
        # 1 by 1 is safer for validation.
        
        print(f"🧠 AI Brain: Generating {count} prompts for {genre_name} ({rules['style_name']})...")
        
        for i in range(count):
            try:
                # Dynamic constraints from yaml if available
                tempo = random.choice(genre_config.get('tempo_variations', range(rules['bpm_range'][0], rules['bpm_range'][1])))
                key = random.choice(genre_config.get('key_variations', ['C Minor']))
                lead = random.choice(genre_config.get('lead_variations', rules['allowed_leads']))
                
                prompt_data = self._generate_single_prompt(genre_name, i+1, rules, tempo, key, lead, base_prompt_text)
                if prompt_data:
                    results.append(prompt_data)
                    
            except Exception as e:
                logger.error(f"Failed to generate prompt {i}: {e}")
                
        return results

    def _generate_single_prompt(self, genre, track_num, rules, target_bpm, target_key, target_lead, base_context):
        
        ollama_prompt = f"""
You are a music production prompt generator for Suno AI.

STRICT RULES (NEVER BREAK):
1. BPM must be EXACTLY {target_bpm}
2. Lead instrument: {target_lead}
3. Key: {target_key}
4. Drums: {rules['drums']}
5. FORBIDDEN elements: {', '.join(rules['forbidden'])}
6. MUST be 100% instrumental (NO vocals, NO lyrics)

Generate a Suno AI prompt for:
- Genre: {genre}
- Context/Vibe: {base_context[:100]}...

Format output EXACTLY as valid JSON:
```json
{{
  "prompt": "your generated prompt string here (max 180 chars)",
  "bpm": {target_bpm},
  "lead": "{target_lead}",
  "mood": "descriptive word",
  "key": "{target_key}"
}}
```
"""
        try:
            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": ollama_prompt,
                    "stream": False,
                    "temperature": 0.7
                },
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Ollama Error: {response.text}")
                return None
                
            result_text = response.json().get('response', '')
            
            # Parse JSON
            json_match = re.search(r'```json\n(.*?)\n```', result_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(1))
            else:
                # Try finding just the brace structure
                json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                else:
                    return None

            # Quick Validation
            if "prompt" in data:
                # Ensure no forbidden words
                p_lower = data['prompt'].lower()
                for bad in rules['forbidden']:
                    if bad in p_lower:
                        # Soft fix: remove the bad word
                        data['prompt'] = re.sub(bad, "", p_lower, flags=re.IGNORECASE)
                return data
                
        except Exception as e:
            logger.error(f"Generation error: {e}")
            return None
            
        return None

class YouTubeMetadataGenerator:
    def __init__(self, genre_data):
        self.genre_data = genre_data

    def generate_seo(self, genre, mix_info):
        """
        mix_info: { 'vol': 5, 'style': 'Jazz', 'track_count': 20 }
        """
        if genre not in self.genre_data:
            return {'error': "Genre not found"}
            
        genre_config = self.genre_data[genre]
        keywords = genre_config.get('seo_keywords', ['Instrumental Music'])
        if isinstance(keywords, str): keywords = [keywords]
        
        prompt = f"""
You are a YouTube SEO expert for a music channel called "BussGroove".
Generate ONLY valid JSON metadata for this video.

VIDEO INFO:
- Genre: {genre}
- Mix Volume: {mix_info.get('vol', '1')}
- Keywords: {', '.join(keywords)}
- Mood: Relaxing, Professional, High Quality

OUTPUT FORMAT:
```json
{{
  "title": "Maximize CTR title here (include '{genre}' and 'Vol. {mix_info.get('vol')}')",
  "description": "2 paragraphs describing the music. Include cues for 'Study', 'Relax', 'Focus' if applicable. End with 'Subscribe to BussGroove'.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
}}
```
"""
        try:
            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.6
                },
                timeout=30
            )
            
            result_text = response.json().get('response', '')
            
            json_match = re.search(r'```json\n(.*?)\n```', result_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            else:
                 # Try finding just the brace structure
                json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(0))
                    
            return {'error': "Failed to parse AI response"}
            
        except Exception as e:
            return {'error': str(e)}

    def check_status(self):
        try:
            requests.get("http://localhost:11434", timeout=2)
            return True
        except:
            return False
