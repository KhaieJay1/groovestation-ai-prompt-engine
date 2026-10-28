import json
import os

LOCK_FILE = "sound_locks.json"

class SoundLockManager:
    def __init__(self):
        self.profiles = []
        self.active_id = None
        self.load_locks()

    def load_locks(self):
        """Loads profiles from JSON."""
        if os.path.exists(LOCK_FILE):
            try:
                with open(LOCK_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.profiles = data.get('profiles', [])
                    self.active_id = data.get('active_profile_id')
            except Exception as e:
                print(f"❌ Error loading SoundLocks: {e}")
                self.profiles = []

    def get_active_profile(self):
        """Returns the currently active SoundLock Profile object."""
        for p in self.profiles:
            if p['id'] == self.active_id:
                return p
        return None  # Fallback needed?

    def set_active_profile(self, profile_id):
        """Updates the active profile and saves to disk."""
        self.active_id = profile_id
        # Reload to ensure we have fresh data
        # Actually just read-write logic needed here
        # We need to preserve the rest of the JSON structure
        if os.path.exists(LOCK_FILE):
             with open(LOCK_FILE, 'r', encoding='utf-8') as f:
                 data = json.load(f)
             
             data['active_profile_id'] = profile_id
             
             with open(LOCK_FILE, 'w', encoding='utf-8') as f:
                 json.dump(data, f, indent=4)
        
        print(f"✅ SoundLock Active Profile set to: {profile_id}")

    def get_all_profiles(self):
        """Returns list of full profile objects for UI."""
        return self.profiles

    def validate_prompt(self, text):
        """Checks if text contains forbidden words from active profile."""
        profile = self.get_active_profile()
        if not profile:
            return True, "No Active Profile"
        
        forbidden = profile.get('forbidden_instruments', [])
        found_violations = []
        
        # Simple case-insensitive check
        text_lower = text.lower()
        for word in forbidden:
            if word.lower() in text_lower:
                found_violations.append(word)
        
        if found_violations:
            return False, f"Forbidden terms found: {', '.join(found_violations)}"
        
        return True, "Valid"
