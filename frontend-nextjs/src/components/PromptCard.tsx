"use client";
import React from 'react';
import { FileText, ExternalLink, Copy, Star, Clock, Hash, Zap } from 'lucide-react';

interface PromptCardProps {
    prompt: {
        prompt_id: string;
        prompt_name: string;
        full_prompt_text: string;
        style_name: string;
        style_color: string;
        tempo_bpm: number;
        structure: string;
        purpose: string;
        status: string;
        performance_rating: number;
        times_used: number;
        last_used_date: string;
    };
    onEdit: (id: string) => void;
    onCopy: (id: string, text: string) => void;
}

const colorConfig: Record<string, { bg: string; text: string; glow: string }> = {
    'Gold': { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    'Yellow': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
    'Red': { bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/20' },
    'Cyan': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    'Purple': { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    'Gray': { bg: 'bg-neutral-500/20', text: 'text-neutral-400', glow: 'shadow-neutral-500/20' },
};

const statusConfig: Record<string, { bg: string; text: string }> = {
    'Draft': { bg: 'bg-neutral-500/20', text: 'text-neutral-400' },
    'Testing': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    'Validated': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    'Archived': { bg: 'bg-red-500/20', text: 'text-red-400' },
};

export function PromptCard({ prompt, onEdit, onCopy }: PromptCardProps) {
    const color = colorConfig[prompt.style_color] || colorConfig['Gray'];
    const status = statusConfig[prompt.status] || statusConfig['Draft'];

    return (
        <div
            className={`
                group relative overflow-hidden cursor-pointer
                bg-gradient-to-br from-neutral-800/80 to-neutral-900/90
                backdrop-blur-sm
                border border-neutral-700/50
                rounded-2xl
                shadow-xl hover:shadow-2xl ${color.glow}
                transition-all duration-300
                hover:border-neutral-600/70
                hover:translate-y-[-2px]
            `}
            onClick={() => onEdit(prompt.prompt_id)}
        >
            {/* Status Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 
                ${prompt.status === 'Validated' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    prompt.status === 'Testing' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                        prompt.status === 'Draft' ? 'bg-gradient-to-r from-neutral-500 to-neutral-400' :
                            'bg-gradient-to-r from-red-500 to-orange-500'}`}
            />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className={`
                        w-14 h-14 rounded-xl flex-shrink-0
                        ${color.bg} 
                        flex items-center justify-center
                        border border-white/5
                    `}>
                        <FileText size={24} className={color.text} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate mb-1">
                            {prompt.prompt_name}
                        </h3>
                        <p className={`${color.text} text-sm font-medium`}>{prompt.style_name}</p>
                    </div>

                    {/* Quick Copy Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onCopy(prompt.prompt_id, prompt.full_prompt_text); }}
                        className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
                        title="Copy prompt text"
                    >
                        <Copy size={18} />
                    </button>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1.5 text-neutral-400">
                        <Zap size={14} className="text-yellow-400" />
                        <span>{prompt.tempo_bpm} BPM</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-400">
                        <Hash size={14} />
                        <span>{prompt.times_used}x used</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star
                                key={i}
                                size={12}
                                className={i <= Math.round(prompt.performance_rating / 2) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'}
                            />
                        ))}
                    </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className={`${status.bg} ${status.text} text-xs font-medium px-3 py-1.5 rounded-lg border border-white/5`}>
                        {prompt.status}
                    </span>
                    <span className="bg-white/5 text-neutral-400 text-xs px-3 py-1.5 rounded-lg border border-white/5">
                        {prompt.purpose}
                    </span>
                </div>

                {/* Structure Preview */}
                {prompt.structure && (
                    <div className="bg-black/20 rounded-xl px-4 py-3 mb-4 border border-white/5">
                        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Structure</p>
                        <p className="text-neutral-300 text-sm font-mono">{prompt.structure}</p>
                    </div>
                )}

                {/* Prompt Preview */}
                <div className="bg-black/20 rounded-xl px-4 py-3 border border-white/5">
                    <p className="text-neutral-400 text-sm line-clamp-2 font-mono">
                        {prompt.full_prompt_text.slice(0, 150)}...
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
                        <Clock size={12} />
                        <span>Last used: {prompt.last_used_date}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
