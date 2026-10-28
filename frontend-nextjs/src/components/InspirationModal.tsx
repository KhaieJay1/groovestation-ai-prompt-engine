"use client";
import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface Inspiration {
    inspiration_id?: string;
    source_title: string;
    source_artist: string;
    source_link: string;
    why_i_like_it: string;
    what_to_use: string;
    tags: string[];
    detailed_notes: string;
    target_vibe: string;
    priority: number;
    status: string;
    last_listened?: string;
}

interface InspirationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Inspiration) => void;
    editData?: Inspiration | null;
}

const VIBES = [
    { value: 'Lounge Vibes', color: 'bg-amber-500' },
    { value: 'BrassGroove', color: 'bg-yellow-500' },
    { value: 'Street Rhythm', color: 'bg-red-500' },
    { value: 'Chill House', color: 'bg-cyan-500' },
    { value: 'Dark Grooves', color: 'bg-purple-500' },
];

const USE_OPTIONS = ['Rhythm', 'Melody', 'Vibe', 'Arrangement', 'Vocals', 'Bass', 'Percussion', 'Synth', 'Other'];
const STATUSES = ['new', 'in_progress', 'developed', 'archived'];

const defaultForm: Inspiration = {
    source_title: '',
    source_artist: '',
    source_link: '',
    why_i_like_it: '',
    what_to_use: 'Vibe',
    tags: [],
    detailed_notes: '',
    target_vibe: 'Lounge Vibes',
    priority: 3,
    status: 'new',
};

export function InspirationModal({ isOpen, onClose, onSave, editData }: InspirationModalProps) {
    const [form, setForm] = useState<Inspiration>(defaultForm);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (editData) {
            setForm(editData);
        } else {
            setForm(defaultForm);
        }
    }, [editData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name === 'priority' ? parseInt(value) : value }));
    };

    const addTag = () => {
        if (tagInput.trim() && !form.tags.includes(tagInput.trim().toLowerCase())) {
            setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim().toLowerCase()] }));
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    const priorityLabels = ['', '🔥 Urgent', '⚡ High', '● Normal', '○ Low', '◌ Later'];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                    <h2 className="text-xl font-bold text-white">
                        {editData ? 'Edit Inspiration' : 'Add New Inspiration'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                    {/* Source Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Song Title *</label>
                            <input
                                type="text"
                                name="source_title"
                                value={form.source_title}
                                onChange={handleChange}
                                required
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition"
                                placeholder="What song inspired you?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Artist</label>
                            <input
                                type="text"
                                name="source_artist"
                                value={form.source_artist}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition"
                                placeholder="Who made it?"
                            />
                        </div>
                    </div>

                    {/* Link */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Source Link</label>
                        <input
                            type="url"
                            name="source_link"
                            value={form.source_link}
                            onChange={handleChange}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition"
                            placeholder="Spotify, YouTube, SoundCloud URL..."
                        />
                    </div>

                    {/* Why I Like It */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Why I Like It *</label>
                        <textarea
                            name="why_i_like_it"
                            value={form.why_i_like_it}
                            onChange={handleChange}
                            required
                            rows={2}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition resize-none"
                            placeholder="What caught your attention? What made you stop and listen?"
                        />
                    </div>

                    {/* Target Vibe - Visual Selector */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-3">Target Vibe</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {VIBES.map(vibe => (
                                <button
                                    key={vibe.value}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, target_vibe: vibe.value }))}
                                    className={`
                                        relative px-3 py-3 rounded-xl text-xs font-medium transition
                                        border-2
                                        ${form.target_vibe === vibe.value
                                            ? `${vibe.color} border-white text-white`
                                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'}
                                    `}
                                >
                                    {vibe.value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* What to Use */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">What to Use</label>
                        <div className="flex flex-wrap gap-2">
                            {USE_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, what_to_use: opt }))}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium transition
                                        ${form.what_to_use === opt
                                            ? 'bg-white text-black'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}
                                    `}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Element Tags</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition"
                                placeholder="trumpet, 808 bass, vocal chop..."
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center hover:bg-neutral-200 transition"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="bg-neutral-800 border border-neutral-700 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-2"
                                >
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="text-neutral-400 hover:text-red-400 transition"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Priority: <span className="text-white">{priorityLabels[form.priority]}</span>
                        </label>
                        <input
                            type="range"
                            name="priority"
                            min="1"
                            max="5"
                            value={form.priority}
                            onChange={handleChange}
                            className="w-full h-2 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-white"
                        />
                        <div className="flex justify-between text-xs text-neutral-500 mt-1">
                            <span>Urgent</span>
                            <span>Later</span>
                        </div>
                    </div>

                    {/* Status (only for edit) */}
                    {editData && (
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Status</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition capitalize"
                            >
                                {STATUSES.map(s => (
                                    <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Detailed Notes */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Detailed Notes</label>
                        <textarea
                            name="detailed_notes"
                            value={form.detailed_notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition resize-none"
                            placeholder="Any additional thoughts on how you'll develop this inspiration..."
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-neutral-400 hover:text-white font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-neutral-200 transition shadow-lg"
                        >
                            {editData ? 'Save Changes' : 'Add Inspiration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
