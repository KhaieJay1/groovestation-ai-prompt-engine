"use client";
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Style {
    style_id?: string;
    style_name: string;
    tempo_range: string;
    energy_level: string;
    mood_keywords: string;
    instrumentation_include: string;
    instrumentation_exclude: string;
    bass_style: string;
    vocal_style: string;
    reference_artists: string;
    color_tag: string;
    use_cases: string;
    notes: string;
    status: string;
}

interface StyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Style) => void;
    editData?: Style | null;
}

const COLOR_OPTIONS = ['Gold', 'Yellow', 'Red', 'Cyan', 'Purple', 'Blue', 'Green'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

const defaultForm: Style = {
    style_name: '',
    tempo_range: '98-104 BPM',
    energy_level: '5/10',
    mood_keywords: '',
    instrumentation_include: '',
    instrumentation_exclude: '',
    bass_style: '',
    vocal_style: '',
    reference_artists: '',
    color_tag: 'Gold',
    use_cases: '',
    notes: '',
    status: 'Active'
};

const colorPreview: Record<string, string> = {
    'Gold': 'bg-amber-500',
    'Yellow': 'bg-yellow-500',
    'Red': 'bg-red-500',
    'Cyan': 'bg-cyan-500',
    'Purple': 'bg-purple-500',
    'Blue': 'bg-blue-500',
    'Green': 'bg-emerald-500',
};

export function StyleModal({ isOpen, onClose, onSave, editData }: StyleModalProps) {
    const [form, setForm] = useState<Style>(defaultForm);

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
        setForm(prev => ({ ...prev, [name]: value }));
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
                        {editData ? 'Edit Style' : 'New Style'}
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
                    {/* Name & Color */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Style Name *</label>
                            <input
                                type="text"
                                name="style_name"
                                value={form.style_name}
                                onChange={handleChange}
                                required
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="e.g., Luxury Afro Lounge"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Color Tag</label>
                            <div className="flex gap-2">
                                {COLOR_OPTIONS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, color_tag: c }))}
                                        className={`w-10 h-10 rounded-xl ${colorPreview[c]} transition-all ${form.color_tag === c ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'opacity-50 hover:opacity-80'
                                            }`}
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tempo & Energy */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Tempo Range</label>
                            <input
                                type="text"
                                name="tempo_range"
                                value={form.tempo_range}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="e.g., 98-104 BPM"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Energy Level</label>
                            <input
                                type="text"
                                name="energy_level"
                                value={form.energy_level}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="e.g., 5-6/10 (sophisticated)"
                            />
                        </div>
                    </div>

                    {/* Mood Keywords */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Mood Keywords</label>
                        <input
                            type="text"
                            name="mood_keywords"
                            value={form.mood_keywords}
                            onChange={handleChange}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                            placeholder="luxury, elegant, golden hour (comma separated)"
                        />
                    </div>

                    {/* Instrumentation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Include Instruments</label>
                            <textarea
                                name="instrumentation_include"
                                value={form.instrumentation_include}
                                onChange={handleChange}
                                rows={2}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition resize-none"
                                placeholder="Rhodes keys, soft pads, kalimba..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Exclude Instruments</label>
                            <textarea
                                name="instrumentation_exclude"
                                value={form.instrumentation_exclude}
                                onChange={handleChange}
                                rows={2}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition resize-none"
                                placeholder="NO trumpet, NO brass, NO horns..."
                            />
                        </div>
                    </div>

                    {/* Bass & Vocals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Bass Style</label>
                            <input
                                type="text"
                                name="bass_style"
                                value={form.bass_style}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="Warm, rounded, low volume"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Vocal Style</label>
                            <input
                                type="text"
                                name="vocal_style"
                                value={form.vocal_style}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="Minimal, whispered, atmospheric"
                            />
                        </div>
                    </div>

                    {/* Reference Artists & Use Cases */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Reference Artists</label>
                            <input
                                type="text"
                                name="reference_artists"
                                value={form.reference_artists}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="Black Coffee, Bonobo"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Use Cases</label>
                            <input
                                type="text"
                                name="use_cases"
                                value={form.use_cases}
                                onChange={handleChange}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                                placeholder="yachts, spas, corporate events"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Status</label>
                        <div className="flex gap-2">
                            {STATUS_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, status: s }))}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${form.status === s
                                            ? s === 'Active' ? 'bg-emerald-500 text-black' : 'bg-neutral-500 text-white'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
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
                            {editData ? 'Save Changes' : 'Create Style'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
