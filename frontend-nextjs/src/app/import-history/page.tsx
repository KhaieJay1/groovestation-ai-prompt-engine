"use client";

import React, { useState, useEffect } from 'react';

type VideoEntry = {
    id: number;
    title: string;
    link: string;
    date: string;
    status: string;
    views: number;
    playlistName: string;
};

export default function ImportHistoryPage() {
    const [entries, setEntries] = useState<VideoEntry[]>([]);
    const [playlists, setPlaylists] = useState<string[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [date, setDate] = useState('');
    const [status, setStatus] = useState('Published');
    const [views, setViews] = useState(0);
    const [playlistName, setPlaylistName] = useState('');

    useEffect(() => {
        // Fetch playlist names for dropdown
        fetch('/api/database/playlists-names')
            .then(res => res.json())
            .then(data => setPlaylists(data))
            .catch(err => console.error(err));
    }, []);

    const addEntry = () => {
        if (!title || !link || !date) {
            alert("Please fill in Title, Link, and Date");
            return;
        }

        const newEntry: VideoEntry = {
            id: Date.now(),
            title,
            link,
            date,
            status,
            views,
            playlistName
        };

        setEntries([...entries, newEntry]);

        // Reset form
        setTitle('');
        setLink('');
        setDate('');
        setViews(0);
        setPlaylistName('');
    };

    const removeEntry = (id: number) => {
        setEntries(entries.filter(e => e.id !== id));
    };

    const handleSubmit = async () => {
        if (entries.length === 0) return;

        if (!confirm(`Import ${entries.length} videos into the database? This will update metrics.`)) return;

        try {
            const res = await fetch('/api/database/import-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videos: entries })
            });

            if (res.ok) {
                const json = await res.json();
                alert(`✅ Success! ${json.message}`);
                window.location.href = '/kpis';
            } else {
                alert("❌ Error importing videos.");
            }
        } catch (error) {
            console.error(error);
            alert("❌ Network error.");
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-green-400 font-mono p-8 selection:bg-green-900 selection:text-white">
            <h1 className="text-3xl font-bold mb-2">📹 IMPORT EXISTING YOUTUBE VIDEOS</h1>
            <p className="text-sm text-green-600 mb-8 border-b border-green-800 pb-4">
                Import your existing 13 videos to establish an accurate baseline for the KPI Dashboard.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* FORM SECTION */}
                <div className="bg-black/40 border border-green-800 p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Add Video Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-green-600 mb-1">YouTube Video Title *</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-900 border border-green-800 p-2 text-white focus:outline-none focus:border-green-500"
                                placeholder="e.g. Afro House | Street Rhythms Mix Vol. 03"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-green-600 mb-1">YouTube Link *</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-900 border border-green-800 p-2 text-white focus:outline-none focus:border-green-500"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={link}
                                onChange={e => setLink(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-green-600 mb-1">Upload Date *</label>
                                <input
                                    type="date"
                                    className="w-full bg-neutral-900 border border-green-800 p-2 text-white focus:outline-none focus:border-green-500"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-green-600 mb-1">Status *</label>
                                <select
                                    className="w-full bg-neutral-900 border border-green-800 p-2 text-white focus:outline-none focus:border-green-500"
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                >
                                    <option>Published</option>
                                    <option>Private</option>
                                    <option>Scheduled</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-green-600 mb-1">Current Views</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-900 border border-green-800 p-2 text-white focus:outline-none focus:border-green-500"
                                    value={views}
                                    onChange={e => setViews(parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-green-600 mb-1">Associate with Playlist</label>
                                <input
                                    list="playlist-options"
                                    className="w-full bg-neutral-900 border border-green-800 p-2 text-white focus:outline-none focus:border-green-500"
                                    placeholder="Type to search..."
                                    value={playlistName}
                                    onChange={e => setPlaylistName(e.target.value)}
                                />
                                <datalist id="playlist-options">
                                    {playlists.map(p => <option key={p} value={p} />)}
                                </datalist>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={addEntry}
                                className="w-full py-3 bg-green-900/40 hover:bg-green-800 border border-green-600 text-white font-bold uppercase transition-colors"
                            >
                                + Add to Import List
                            </button>
                        </div>
                    </div>
                </div>

                {/* LIST SECTION */}
                <div className="bg-black/40 border border-green-800 p-6 rounded-lg flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Videos to Import ({entries.length})</h2>
                        {entries.length > 0 && (
                            <button onClick={() => setEntries([])} className="text-xs text-red-500 hover:text-red-400">Clear All</button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 mb-4 pr-2">
                        {entries.length === 0 && (
                            <div className="text-center py-20 text-neutral-600 italic border-2 border-dashed border-neutral-800 rounded">
                                No videos added yet. Fill out the form to begin.
                            </div>
                        )}
                        {entries.map(entry => (
                            <div key={entry.id} className="p-3 border border-green-900 bg-green-900/10 rounded group relative">
                                <button
                                    onClick={() => removeEntry(entry.id)}
                                    className="absolute top-2 right-2 text-neutral-500 hover:text-red-500 font-bold"
                                    title="Remove"
                                >
                                    ×
                                </button>
                                <div className="font-bold text-white pr-6 truncate">{entry.title}</div>
                                <div className="text-xs text-green-600 flex gap-4 mt-1">
                                    <span>📅 {entry.date}</span>
                                    <span>👁️ {entry.views} views</span>
                                    {entry.playlistName && (
                                        <span className="text-yellow-500">🔗 {entry.playlistName}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-green-900">
                        <button
                            onClick={handleSubmit}
                            disabled={entries.length === 0}
                            className={`w-full py-4 font-bold uppercase text-lg tracking-wider transition-all
                                ${entries.length > 0
                                    ? 'bg-green-600 hover:bg-green-500 text-black shadow-[0_0_20px_rgba(0,255,0,0.3)]'
                                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
                        >
                            🎯 Import All Videos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
