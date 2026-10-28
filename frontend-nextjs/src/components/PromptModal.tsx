"use client";
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Prompt {
    prompt_id?: string;
    style_id: string;
    prompt_name: string;
    full_prompt_text: string;
    lyrics: string;
    tempo_bpm: number;
    structure: string;
    purpose: string;
    target_platforms: string;
    status: string;
    performance_rating: number;
    notes: string;
}

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Prompt) => void;
    editData?: Prompt | null;
    styles: { style_id: string; style_name: string; color_tag: string }[];
}

const PURPOSE_OPTIONS = ['Production', 'Experiment', 'Client Work', 'Personal'];
const STATUS_OPTIONS = ['Draft', 'Testing', 'Validated', 'Archived'];

const defaultForm: Prompt = {
    style_id: 'STYLE_001',
    prompt_name: '',
    full_prompt_text: '',
    lyrics: '',
    tempo_bpm: 100,
    structure: '[Intro]/[Verse]/[Hook]/[Verse]/[Outro]',
    purpose: 'Production',
    target_platforms: 'YouTube, Spotify',
    status: 'Draft',
    performance_rating: 5,
    notes: ''
};

export function PromptModal({ isOpen, onClose, onSave, editData, styles }: PromptModalProps) {
    const [form, setForm] = useState<Prompt>(defaultForm);

    useEffect(() => {
        if (editData) {
            setForm({ ...defaultForm, ...editData }); // Merge with default to ensure new fields
        } else {
            setForm(defaultForm);
        }
    }, [editData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'tempo_bpm' || name === 'performance_rating' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                    <h2 className="text-xl font-bold text-white">
                        {editData ? 'Edit Prompt' : 'New Prompt'}
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

                    {/* SECTION 1: STYLE PROMPT / DESCRIPTION (Top Priority) */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Style Prompt / Description</label>
                        <textarea
                            name="full_prompt_text"
                            value={form.full_prompt_text}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition resize-none"
                            placeholder="e.g. Afro House/Rubadub club banger with deep Naija male... "
                        />
                    </div>

                    {/* SECTION 2: LYRICS (Top Priority) */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Lyrics</label>
                        <textarea
                            name="lyrics"
                            value={form.lyrics}
                            onChange={handleChange}
                            rows={8}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition resize-none font-mono text-sm"
                            placeholder="Paste your full lyrics here..."
                        />
                    </div>

                    {/* SECTION 3: IDENTIFICATION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Prompt Name *</label>
                            <input
                                type="text"
                                name="prompt_name"
                                value={form.prompt_name}
                                onChange={handleChange}
                                required
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="e.g., Soft Life No Be Crime"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Style Link</label>
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

                    {/* SECTION 4: TECHNICAL DETAILS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Structure</label>
                            <input
                                type="text"
                                name="structure"
                                value={form.structure}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition font-mono"
                                placeholder="[Intro]/[Verse]..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Tempo (BPM)</label>
                            <input
                                type="number"
                                name="tempo_bpm"
                                value={form.tempo_bpm}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Target Platforms</label>
                            <input
                                type="text"
                                name="target_platforms"
                                value={form.target_platforms}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Performance Rating: <span className="text-yellow-400">{form.performance_rating}/10</span>
                        </label>
                        <input
                            type="range"
                            name="performance_rating"
                            min="1"
                            max="10"
                            value={form.performance_rating}
                            onChange={handleChange}
                            className="w-full h-2 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>

                    {/* SECTION 5: METADATA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Purpose</label>
                            <div className="flex flex-wrap gap-2">
                                {PURPOSE_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, purpose: opt }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${form.purpose === opt
                                            ? 'bg-white text-black'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, status: opt }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${form.status === opt
                                            ? opt === 'Validated' ? 'bg-emerald-500 text-black'
                                                : opt === 'Testing' ? 'bg-blue-500 text-black'
                                                    : opt === 'Archived' ? 'bg-red-500 text-white'
                                                        : 'bg-white text-black'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Notes</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={2}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition resize-none"
                            placeholder="Additional notes..."
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
                            {editData ? 'Save Changes' : 'Create Prompt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
