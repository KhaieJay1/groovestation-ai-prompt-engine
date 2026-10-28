"""
BussGroove Audio Processor - Instrumental Analysis Only
No vocal transcription needed for instrumental catalogs.
"""

import librosa
import numpy as np


def estimate_key(y, sr):
    """Estimate musical key using Krumhansl-Schmuckler algorithm."""
    try:
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_sum = np.sum(chroma, axis=1)
        
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
        
        maj_corrs = []
        min_corrs = []
        
        for i in range(12):
            maj_profile_rolled = np.roll(major_profile, i)
            min_profile_rolled = np.roll(minor_profile, i)
            maj_corrs.append(np.corrcoef(chroma_sum, maj_profile_rolled)[0, 1])
            min_corrs.append(np.corrcoef(chroma_sum, min_profile_rolled)[0, 1])
            
        key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        best_maj_idx = np.argmax(maj_corrs)
        best_min_idx = np.argmax(min_corrs)
        
        match_score = max(maj_corrs[best_maj_idx], min_corrs[best_min_idx])
        confidence = int(max(0, min(100, (match_score * 100))))

        if maj_corrs[best_maj_idx] > min_corrs[best_min_idx]:
            return f"{key_names[best_maj_idx]} Major", confidence
        else:
            return f"{key_names[best_min_idx]} Minor", confidence
            
    except Exception as e:
        print(f"Key Estimation Error: {e}")
        return "Unknown", 0


def analyze_track(file_path, include_transcription=False):
    """
    Analyze audio track for instrumental properties.
    include_transcription parameter kept for backwards compatibility but ignored.
    """
    print(f"Loading {file_path}...")
    y, sr = librosa.load(file_path, sr=None)
    
    # 1. Duration
    duration = librosa.get_duration(y=y, sr=sr)
    
    # 2. Separate harmonic and percussive
    y_harmonic, y_percussive = librosa.effects.hpss(y)
    
    # 3. Tempo/BPM
    tempo, beats = librosa.beat.beat_track(y=y_percussive, sr=sr)
    
    # 4. Key
    key, key_conf = estimate_key(y_harmonic, sr)
    
    # 5. Energy (RMS)
    rms = librosa.feature.rms(y=y)[0]
    avg_rms = np.mean(rms)
    energy_score = min(10, max(1, int(avg_rms * 150)))  # Scale 1-10
    
    # 6. Spectral brightness (for mood hints)
    spec_cent = librosa.feature.spectral_centroid(y=y, sr=sr)
    brightness = float(np.mean(spec_cent))
    
    # 7. Waveform for visualization (downsampled)
    waveform = y[::100]
    
    return {
        "duration_seconds": int(float(duration)),
        "bpm": int(float(tempo)),
        "key": key,
        "key_confidence": key_conf,
        "energy": energy_score,
        "brightness": brightness,
        "waveform": waveform,
    }
