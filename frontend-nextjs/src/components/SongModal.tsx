"use client";
import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';

interface Song {
    song_id?: string;
    title?: string;
    style_id: string;
    suno_link: string;
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

interface SongModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Song) => void;
    editData?: Song | null;
    styles: { style_id: string; style_name: string; color_tag: string }[];
}

const DOWNLOAD_OPTIONS = ['Pending', 'Downloaded', 'Failed'];

const defaultForm: Song = {
    title: '',
    style_id: 'STYLE_001',
    suno_link: '',
    duration_seconds: 0,
    subjective_rating: 5,
    similarity_tag: '',
    approved_for_release: false,
    release_date: '',
    platform_youtube: '',
    platform_spotify: '',
    download_status: 'Pending',
    local_file_path: '',
    notes: ''
};

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${i <= value
                        ? 'bg-yellow-500 text-black'
                        : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                        }`}
                >
                    {i}
                </button>
            ))}
        </div>
    );
}

export function SongModal({ isOpen, onClose, onSave, editData, styles }: SongModalProps) {
    const [form, setForm] = useState<Song>(defaultForm);

    useEffect(() => {
        if (editData) {
            setForm(editData);
        } else {
            setForm(defaultForm);
        }
    }, [editData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                name === 'duration_seconds' ? parseInt(value) || 0 :
                    value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    // Parse duration for display
    const durationMins = Math.floor(form.duration_seconds / 60);
    const durationSecs = form.duration_seconds % 60;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                    <h2 className="text-xl font-bold text-white">
                        {editData ? 'Edit Song' : 'Add New Song'}
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
                    {/* Title & Style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Song Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                required
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="Give your song a name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Style</label>
                            <select
                                name="style_id"
                                value={form.style_id}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                            >
                                {styles.map(s => (
                                    <option key={s.style_id} value={s.style_id}>{s.style_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Suno Link */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Suno Link</label>
                        <input
                            type="url"
                            name="suno_link"
                            value={form.suno_link}
                            onChange={handleChange}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                            placeholder="https://suno.ai/song/..."
                        />
                    </div>

                    {/* Duration & Rating */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Duration</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={durationMins}
                                    onChange={(e) => setForm(prev => ({
                                        ...prev,
                                        duration_seconds: (parseInt(e.target.value) || 0) * 60 + (prev.duration_seconds % 60)
                                    }))}
                                    className="w-20 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-3 text-center focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                    placeholder="0"
                                />
                                <span className="text-neutral-400 self-center">:</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={durationSecs}
                                    onChange={(e) => setForm(prev => ({
                                        ...prev,
                                        duration_seconds: Math.floor(prev.duration_seconds / 60) * 60 + (parseInt(e.target.value) || 0)
                                    }))}
                                    className="w-20 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-3 text-center focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                    placeholder="00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Rating: <span className="text-yellow-400">{form.subjective_rating}/10</span>
                            </label>
                            <RatingInput value={form.subjective_rating} onChange={(v) => setForm(prev => ({ ...prev, subjective_rating: v }))} />
                        </div>
                    </div>

                    {/* Similarity Tag */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Series / Similarity Tag</label>
                        <input
                            type="text"
                            name="similarity_tag"
                            value={form.similarity_tag}
                            onChange={handleChange}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                            placeholder="e.g., Evening Gold Series, Summer Vibes Vol 1"
                        />
                    </div>

                    {/* Approval & Download Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="approved_for_release"
                                    checked={form.approved_for_release}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded bg-neutral-800 border-neutral-700 text-green-500 focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-neutral-300">Approved for Release</span>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Download Status</label>
                            <div className="flex gap-2">
                                {DOWNLOAD_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, download_status: opt }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${form.download_status === opt
                                            ? 'bg-white text-black'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">YouTube URL</label>
                            <input
                                type="url"
                                name="platform_youtube"
                                value={form.platform_youtube}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="https://youtube.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Spotify URI</label>
                            <input
                                type="text"
                                name="platform_spotify"
                                value={form.platform_spotify}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="spotify:track:..."
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Notes</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition resize-none"
                            placeholder="Any notes about this track..."
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
                            {editData ? 'Save Changes' : 'Add Song'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
