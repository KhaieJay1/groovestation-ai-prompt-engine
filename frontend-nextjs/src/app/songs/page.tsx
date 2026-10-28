"use client";
import React, { useState, useEffect } from 'react';
import { Music, Plus, Filter, CheckCircle, Clock, Download, Star } from 'lucide-react';
import { SongCard } from '@/components/SongCard';
import { SongModal } from '@/components/SongModal';

interface Song {
    song_id: string;
    title?: string;
    style_id: string;
    style_name: string;
    style_color: string;
    suno_link: string;
    generated_date: string;
    duration_seconds: number;
    subjective_rating: number;
    similarity_tag: string;
    approved_for_release: boolean;
    release_date: string;
    platform_youtube: string;
    platform_spotify: string;
    download_status: string;
    local_file_path: string;
    notes: string;
}

interface Style {
    style_id: string;
    style_name: string;
    color_tag: string;
}

const STATUS_FILTERS = [
    { value: 'all', label: 'All', icon: null },
    { value: 'approved', label: 'Approved', icon: <CheckCircle size={14} /> },
    { value: 'pending', label: 'Pending', icon: <Clock size={14} /> },
    { value: 'downloaded', label: 'Downloaded', icon: <Download size={14} /> },
];

export default function SongsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [styles, setStyles] = useState<Style[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);

    const fetchSongs = async () => {
        try {
            const res = await fetch('/api/songs');
            const data = await res.json();
            setSongs(data);
        } catch (error) {
            console.error('Failed to fetch songs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStyles = async () => {
        try {
            const res = await fetch('/api/styles');
            const data = await res.json();
            setStyles(data);
        } catch (error) {
            console.error('Failed to fetch styles:', error);
            // Fallback styles
            setStyles([{ style_id: 'STYLE_001', style_name: 'Luxury Afro Lounge', color_tag: 'Gold' }]);
        }
    };

    useEffect(() => {
        fetchSongs();
        fetchStyles();
    }, []);

    // Filter songs
    const filtered = songs.filter(song => {
        if (filter === 'all') return true;
        if (filter === 'approved') return song.approved_for_release;
        if (filter === 'pending') return !song.approved_for_release;
        if (filter === 'downloaded') return song.download_status === 'Downloaded';
        return true;
    });

    // Sort by date (newest first), then by rating
    const sorted = [...filtered].sort((a, b) => {
        const dateCompare = new Date(b.generated_date).getTime() - new Date(a.generated_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.subjective_rating - a.subjective_rating;
    });

    // Stats
    const totalSongs = songs.length;
    const avgRating = songs.length > 0
        ? (songs.reduce((sum, s) => sum + s.subjective_rating, 0) / songs.length).toFixed(1)
        : '0';
    const approvedCount = songs.filter(s => s.approved_for_release).length;
    const downloadedCount = songs.filter(s => s.download_status === 'Downloaded').length;

    const handleSave = async (data: any) => {
        try {
            if (data.song_id) {
                await fetch('/api/songs', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } else {
                await fetch('/api/songs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }
            fetchSongs();
            setIsModalOpen(false);
            setEditingSong(null);
        } catch (error) {
            console.error('Failed to save song:', error);
        }
    };

    const handleEdit = (id: string) => {
        const song = songs.find(s => s.song_id === id);
        if (song) {
            setEditingSong(song);
            setIsModalOpen(true);
        }
    };

    const openNewModal = () => {
        setEditingSong(null);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <Music size={28} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Songs Library</h1>
                            <p className="text-neutral-400 text-sm">Your generated music collection</p>
                        </div>
                    </div>
                    <button
                        onClick={openNewModal}
                        className="flex items-center gap-2 bg-white text-black font-semibold px-5 py-3 rounded-xl hover:bg-neutral-200 transition shadow-lg hover:shadow-xl"
                    >
                        <Plus size={20} /> Add Song
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <Music size={20} className="text-neutral-400" />
                            <span className="text-3xl font-bold text-white">{totalSongs}</span>
                        </div>
                        <p className="text-sm text-neutral-300 font-medium">Total Songs</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/10 to-amber-600/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <Star size={20} className="text-yellow-400" />
                            <span className="text-3xl font-bold text-white">{avgRating}</span>
                        </div>
                        <p className="text-sm text-neutral-300 font-medium">Avg Rating</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <CheckCircle size={20} className="text-emerald-400" />
                            <span className="text-3xl font-bold text-white">{approvedCount}</span>
                        </div>
                        <p className="text-sm text-neutral-300 font-medium">Approved</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <Download size={20} className="text-blue-400" />
                            <span className="text-3xl font-bold text-white">{downloadedCount}</span>
                        </div>
                        <p className="text-sm text-neutral-300 font-medium">Downloaded</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 text-neutral-500 mr-2">
                        <Filter size={16} />
                        <span className="text-sm font-medium">Filter:</span>
                    </div>
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`
                                flex items-center gap-2
                                px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap
                                border
                                ${filter === f.value
                                    ? 'bg-white text-black border-white'
                                    : 'bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:border-white/20'}
                            `}
                        >
                            {f.icon}
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Cards Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-3xl bg-neutral-800/50 flex items-center justify-center mx-auto mb-5">
                            <Music size={36} className="text-neutral-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No songs yet</h3>
                        <p className="text-neutral-400 mb-6">Start adding your generated tracks</p>
                        <button
                            onClick={openNewModal}
                            className="inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-neutral-200 transition"
                        >
                            <Plus size={18} /> Add your first song
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {sorted.map(song => (
                            <SongCard
                                key={song.song_id}
                                song={song}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <SongModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingSong(null); }}
                onSave={handleSave}
                editData={editingSong}
                styles={styles}
            />
        </div>
    );
}
