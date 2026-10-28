"use client";
import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Filter, TrendingUp, Clock, CheckCircle, Archive } from 'lucide-react';
import { InspirationCard } from '@/components/InspirationCard';
import { InspirationModal } from '@/components/InspirationModal';

interface Inspiration {
    inspiration_id: string;
    source_title: string;
    source_artist: string;
    source_link: string;
    discovered_date: string;
    last_listened: string;
    why_i_like_it: string;
    what_to_use: string;
    tags: string[];
    detailed_notes: string;
    target_vibe: string;
    priority: number;
    status: string;
    developed_song_id: string | null;
}

const STATUS_FILTERS = [
    { value: 'all', label: 'All', icon: null },
    { value: 'new', label: 'New', icon: <Lightbulb size={14} /> },
    { value: 'in_progress', label: 'In Progress', icon: <TrendingUp size={14} /> },
    { value: 'developed', label: 'Developed', icon: <CheckCircle size={14} /> },
    { value: 'archived', label: 'Archived', icon: <Archive size={14} /> },
];

const statConfig: Record<string, { icon: React.ReactNode; gradient: string }> = {
    new: { icon: <Lightbulb size={20} />, gradient: 'from-emerald-500/20 to-emerald-600/10' },
    in_progress: { icon: <TrendingUp size={20} />, gradient: 'from-blue-500/20 to-blue-600/10' },
    developed: { icon: <CheckCircle size={20} />, gradient: 'from-violet-500/20 to-violet-600/10' },
    archived: { icon: <Archive size={20} />, gradient: 'from-neutral-500/20 to-neutral-600/10' },
};

export default function InspirationsPage() {
    const [inspirations, setInspirations] = useState<Inspiration[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInspiration, setEditingInspiration] = useState<Inspiration | null>(null);

    const fetchInspirations = async () => {
        try {
            const res = await fetch('/api/inspirations');
            const data = await res.json();
            setInspirations(data);
        } catch (error) {
            console.error('Failed to fetch inspirations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInspirations();
    }, []);

    const filtered = filter === 'all'
        ? inspirations
        : inspirations.filter(i => i.status === filter);

    const sorted = [...filtered].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(b.discovered_date).getTime() - new Date(a.discovered_date).getTime();
    });

    const handleSave = async (data: any) => {
        try {
            if (data.inspiration_id) {
                await fetch('/api/inspirations', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } else {
                await fetch('/api/inspirations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }
            fetchInspirations();
            setIsModalOpen(false);
            setEditingInspiration(null);
        } catch (error) {
            console.error('Failed to save inspiration:', error);
        }
    };

    const handleEdit = (id: string) => {
        const insp = inspirations.find(i => i.inspiration_id === id);
        if (insp) {
            setEditingInspiration(insp);
            setIsModalOpen(true);
        }
    };

    const handleDevelop = async (id: string) => {
        const insp = inspirations.find(i => i.inspiration_id === id);
        if (insp && insp.status === 'new') {
            await fetch('/api/inspirations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...insp, status: 'in_progress' }),
            });
            fetchInspirations();
        }
    };

    const openNewModal = () => {
        setEditingInspiration(null);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                            <Lightbulb size={28} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Inspirations</h1>
                            <p className="text-neutral-400 text-sm">Capture ideas from songs that move you</p>
                        </div>
                    </div>
                    <button
                        onClick={openNewModal}
                        className="flex items-center gap-2 bg-white text-black font-semibold px-5 py-3 rounded-xl hover:bg-neutral-200 transition shadow-lg hover:shadow-xl"
                    >
                        <Plus size={20} /> Add New
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {['new', 'in_progress', 'developed', 'archived'].map(status => {
                        const count = inspirations.filter(i => i.status === status).length;
                        const config = statConfig[status];
                        const label = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);

                        return (
                            <div
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`
                                    relative overflow-hidden cursor-pointer
                                    bg-gradient-to-br ${config.gradient}
                                    border border-white/10
                                    rounded-2xl p-5
                                    hover:border-white/20 transition
                                    ${filter === status ? 'ring-2 ring-white/30' : ''}
                                `}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-neutral-400">{config.icon}</span>
                                    <span className="text-3xl font-bold text-white">{count}</span>
                                </div>
                                <p className="text-sm text-neutral-300 font-medium">{label}</p>
                            </div>
                        );
                    })}
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
                            <Lightbulb size={36} className="text-neutral-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No inspirations yet</h3>
                        <p className="text-neutral-400 mb-6">Start capturing ideas from songs that inspire you</p>
                        <button
                            onClick={openNewModal}
                            className="inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-neutral-200 transition"
                        >
                            <Plus size={18} /> Add your first inspiration
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {sorted.map(insp => (
                            <InspirationCard
                                key={insp.inspiration_id}
                                inspiration={insp}
                                onEdit={handleEdit}
                                onDevelop={handleDevelop}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <InspirationModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingInspiration(null); }}
                onSave={handleSave}
                editData={editingInspiration}
            />
        </div>
    );
}
