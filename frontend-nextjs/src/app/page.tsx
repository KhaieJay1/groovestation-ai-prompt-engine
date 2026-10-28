"use client";
import React, { useState, useEffect } from 'react';
import { Music, ListMusic, ExternalLink, Target, Play, Clipboard, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Playlist {
  playlist_id: string; // From JSON
  id?: string;         // From DB
  playlist_name: string; // From JSON
  name?: string;         // From DB
  catalog: string;
  catalog_name?: string; // From DB
  track_count_goal: number; // JSON
  tracks_total?: number;    // DB
  tracks_completed: number;
  status: string;
  description: string;
  bpm_min?: number;
  bpm_max?: number;
  due_date?: string;
  color_hex?: string;
}

interface Prompt {
  id: number;
  track_number: number;
  prompt_text: string;
  bpm: number;
  musical_key: string;
  mood: string;
  lead_instrument: string;
  model_used?: string;
}

interface NextTaskData {
  playlist: Playlist | null;
  prompts: Prompt[];
}

export default function Home() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [nextTaskData, setNextTaskData] = useState<NextTaskData | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // 1. Fetch NEXT TASK from Database
    fetch('/api/database/next-task')
      .then(r => r.json())
      .then(data => setNextTaskData(data))
      .catch(err => console.error("Failed to load next task", err));

    // 2. Load existing playlists (From DB now)
    fetch('/api/database/playlists')
      .then(r => r.json())
      .then(data => {
        setPlaylists(Array.isArray(data) ? data : []);
      })
      .catch(() => setPlaylists([]));
  }, []);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleGeneratePrompts = async () => {
    if (!nextTaskData?.playlist) return;
    setGenerating(true);

    try {
      // Generate for the next track number
      const nextTrackNum = (nextTaskData.prompts?.length || 0) + 1;

      const res = await fetch('/api/ollama/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalog: nextTaskData.playlist.catalog_name || nextTaskData.playlist.catalog,
          bpm_min: nextTaskData.playlist.bpm_min,
          bpm_max: nextTaskData.playlist.bpm_max,
          track_number: nextTrackNum
        })
      });

      if (!res.ok) throw new Error("Generation failed");

      const newPrompt = await res.json();

      // Add to local state (in a real app, we'd save to DB too, but for now just show it)
      const promptObj: Prompt = {
        id: Date.now(), // temp ID until refresh
        track_number: nextTrackNum,
        ...newPrompt
      };

      setNextTaskData(prev => prev ? ({
        ...prev,
        prompts: [...prev.prompts, promptObj]
      }) : null);

    } catch (e) {
      console.error(e);
      alert("Failed to generate prompt. Is Ollama running?");
    } finally {
      setGenerating(false);
    }
  };

  const handlePlaylistSelect = (id: number | string) => {
    fetch(`/api/database/playlist-details?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.playlist) {
          setNextTaskData(data);
          // Scroll to top to see selection
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      })
      .catch(err => console.error("Failed to fetch details", err));
  };

  const jazzPlaylists = playlists.filter(p => p.catalog === 'jazz-lofi');
  const afroPlaylists = playlists.filter(p => p.catalog === 'afro-lounge');

  const jazzTotal = jazzPlaylists.reduce((acc, p) => acc + (p.tracks_completed || 0), 0);
  const jazzTarget = jazzPlaylists.reduce((acc, p) => acc + (p.track_count_goal || 0), 0);
  const afroTotal = afroPlaylists.reduce((acc, p) => acc + (p.tracks_completed || 0), 0);
  const afroTarget = afroPlaylists.reduce((acc, p) => acc + (p.track_count_goal || 0), 0);
  const totalTracks = jazzTotal + afroTotal;
  const totalTarget = jazzTarget + afroTarget;

  return (
    <div className="h-full p-6 overflow-auto" style={{ background: 'var(--bg-color)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-2xl font-bold text-white">🎹 Production Dashboard</h1>
          <p className="text-[var(--secondary-text)] text-sm">Unified Workstation • Online</p>
        </div>
        <a
          href="http://localhost:8501"
          target="_blank"
          rel="noopener noreferrer"
          className="btn flex items-center gap-2"
        >
          <ExternalLink size={16} />
          Open Analyzer
        </a>
      </div>

      {/* ========================================================================================= */}
      {/* NEXT TASK WIDGET (Database Driven) */}
      {/* ========================================================================================= */}
      {nextTaskData?.playlist ? (
        <div className="mb-8 p-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <div className="bg-[#1a1b26] rounded-lg p-5">

            {/* Task Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
                    Current Priority
                  </span>
                  <span className="text-gray-300 text-sm font-medium flex items-center gap-2">
                    <span className="text-gray-500">Due:</span> {nextTaskData.playlist.due_date || 'No Date'}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {nextTaskData.playlist.name || nextTaskData.playlist.playlist_name}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>📁 {nextTaskData.playlist.catalog_name || nextTaskData.playlist.catalog}</span>
                  <span>⏱️ {nextTaskData.playlist.bpm_min}-{nextTaskData.playlist.bpm_max} BPM</span>
                  <span>📊 {nextTaskData.playlist.tracks_completed}/{nextTaskData.playlist.tracks_total || 20} Completed</span>
                </div>
              </div>

              <a href={`http://localhost:5000/production/${nextTaskData.playlist.id || nextTaskData.playlist.playlist_id}`}
                target="_blank"
                className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors">
                <Play size={18} fill="currentColor" />
                START PRODUCTION
              </a>
            </div>

            {/* Prompts Section */}
            {nextTaskData.prompts && nextTaskData.prompts.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  🚀 Ready-to-Use Prompts
                  <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs normal-case">{nextTaskData.prompts.length} / 10 Generated</span>
                </h3>

                <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {nextTaskData.prompts.map((prompt) => (
                    <div key={prompt.id} className="bg-[#0f1117] p-4 rounded-lg border border-gray-800 flex gap-5 hover:border-indigo-500 transition-colors group shadow-sm">

                      {/* Track Number Box */}
                      <div className="flex flex-col justify-center items-center w-14 h-14 bg-gray-900 rounded-lg border border-gray-800 shrink-0">
                        <span className="text-[10px] text-gray-500 font-black uppercase">Track</span>
                        <span className="text-xl font-bold text-white">{prompt.track_number}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">

                        {/* Tags Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded font-mono font-bold border border-indigo-500/20">
                            {prompt.bpm} BPM
                          </span>
                          <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded font-mono font-bold border border-purple-500/20">
                            {prompt.musical_key}
                          </span>
                          <span className="text-xs text-gray-500 font-medium px-1">
                            {prompt.mood} • {prompt.lead_instrument}
                          </span>
                        </div>

                        {/* Prompt Text - Full Readability */}
                        <p className="text-sm text-gray-200 font-mono leading-relaxed whitespace-pre-wrap select-all bg-gray-900/50 p-2 rounded border border-gray-800/50">
                          {prompt.prompt_text}
                        </p>
                      </div>

                      {/* Copy Button */}
                      <div className="flex flex-col justify-center">
                        <button
                          onClick={() => copyToClipboard(prompt.prompt_text, prompt.id)}
                          className={`h-full px-4 rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all w-20 border
                            ${copyFeedback === prompt.id
                              ? 'bg-green-600 border-green-500 text-white'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white'
                            }`}
                        >
                          {copyFeedback === prompt.id ? <CheckCircle size={18} /> : <Clipboard size={18} />}
                          {copyFeedback === prompt.id ? 'COPIED' : 'COPY'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Button to generate MORE prompts */}
                <button
                  onClick={handleGeneratePrompts}
                  disabled={generating}
                  className="w-full py-2 mt-2 border border-dashed border-gray-700 text-gray-400 text-sm hover:border-indigo-500 hover:text-indigo-400 rounded transition-colors"
                >
                  {generating ? '✨ Generating...' : '+ Generate Another Prompt'}
                </button>
              </div>
            ) : (
              <div className="bg-[#0f1117]/50 rounded border border-dashed border-gray-700 p-6 text-center">
                <p className="text-gray-400 mb-2">No prompts generated yet for this valid task.</p>
                <button
                  onClick={handleGeneratePrompts}
                  disabled={generating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors"
                >
                  {generating ? '✨ Generating with Ollama...' : '✨ Generate Prompts with Ollama'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card mb-6 border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/10 p-3 rounded-full text-green-500">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
              <p className="text-gray-400 text-sm">No pending playlists found in database.</p>
            </div>
          </div>
        </div>
      )}

      {/* TOTAL PROGRESS */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target size={24} className="text-[var(--primary-color)]" />
            <div>
              <h2 className="text-lg font-bold text-white">Total Progress</h2>
              <p className="text-[var(--secondary-text)] text-xs">100% Instrumental • No Vocals</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{totalTracks}/{totalTarget}</div>
            <div className="text-[var(--secondary-text)] text-xs">tracks completed</div>
          </div>
        </div>
        <div className="h-3 rounded-full" style={{ background: 'var(--bg-color)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: totalTarget > 0 ? `${(totalTracks / totalTarget) * 100}%` : '0%',
              background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))'
            }}
          />
        </div>
      </div>

      {/* DYNAMIC CATALOG GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Responsive Grid */}

        {/* We group playlists by catalog_id or catalog name */}
        {Object.entries(
          playlists.reduce((acc, playlist) => {
            const cat = playlist.catalog_name || playlist.catalog || 'Uncategorized';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(playlist);
            return acc;
          }, {} as Record<string, Playlist[]>)
        ).map(([catalogName, catPlaylists]) => {

          // Calculate stats per catalog
          const catTotal = catPlaylists.reduce((acc, p) => acc + (p.tracks_completed || 0), 0);
          const catTarget = catPlaylists.reduce((acc, p) => acc + (p.track_count_goal || 0), 0);

          // Determine Color based on Catalog Name (temporary mapping until we fetch full catalog objects)
          let catColor = '#6366f1'; // Default Indigo
          if (catalogName.includes('Afro')) catColor = '#f59e0b'; // Amber
          if (catalogName.includes('Ambient') || catalogName.includes('Deep')) catColor = '#0ea5e9'; // Sky Blue
          if (catalogName.includes('Vault')) catColor = '#9ca3af'; // Gray
          if (catalogName.includes('Gold') || catalogName.includes('Soul')) catColor = '#eab308'; // Yellow

          return (
            <div key={catalogName} className="card h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: catColor }}>
                    {catalogName.includes('Afro') ? <ListMusic size={20} className="text-white" /> : <Music size={20} className="text-white" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">{catalogName}</h3>
                    <p className="text-xs text-[var(--secondary-text)] truncate">{catPlaylists.length} Playlists</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xl font-bold" style={{ color: catColor }}>{catTotal}/{catTarget}</div>
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
                {catPlaylists.map(playlist => (
                  <PlaylistRow
                    key={playlist.playlist_id}
                    playlist={playlist}
                    color={catColor}
                    onClick={() => handlePlaylistSelect(playlist.playlist_id)}
                  />
                ))}
              </div>
            </div>
          );
        })}

      </div>

      {/* QUICK INFO */}
      <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <p className="text-sm text-[var(--secondary-text)]">
          <strong className="text-white">Workflow:</strong> Use the <Link href="http://localhost:8501" className="text-[var(--primary-color)] hover:underline">Analyzer</Link> to reverse-engineer reference tracks → Copy to Suno → Save to Database
        </p>
      </div>

    </div>
  );
}

function PlaylistRow({ playlist, color, onClick }: { playlist: Playlist; color: string; onClick: () => void }) {
  const progress = playlist.track_count_goal > 0 ? (playlist.tracks_completed / playlist.track_count_goal) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group active:scale-[0.99]"
    >
      {/* Status Bar Indicator */}
      <div
        className="w-1.5 h-10 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: color }}
      />

      {/* Text Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="text-base font-bold text-gray-200 truncate group-hover:text-white transition-colors">
          {playlist.playlist_name}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <span className={`px-1.5 py-0.5 rounded ${playlist.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
            {playlist.status.toUpperCase()}
          </span>
          {playlist.description && (
            <span className="truncate max-w-[200px] opacity-60">• {playlist.description}</span>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="flex flex-col items-end gap-1">
        <div className="text-sm font-bold text-gray-300 font-mono">
          <span style={{ color: color }}>{playlist.tracks_completed}</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500">{playlist.track_count_goal}</span>
        </div>
        {/* Mini Bar */}
        <div className="w-24 h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: color, opacity: 0.8 }}
          />
        </div>
      </div>
    </div>
  );
}
