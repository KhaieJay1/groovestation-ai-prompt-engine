"use client";
import React from 'react';
import { Palette, Music, Clock, Zap, Users } from 'lucide-react';

interface StyleCardProps {
    style: {
        style_id: string;
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
    };
    songCount: number;
    promptCount: number;
    onEdit: (id: string) => void;
}

const colorConfig: Record<string, { bg: string; border: string; gradient: string }> = {
    'Gold': { bg: 'bg-amber-500/20', border: 'border-amber-500/50', gradient: 'from-amber-500 to-yellow-500' },
    'Yellow': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', gradient: 'from-yellow-500 to-orange-500' },
    'Red': { bg: 'bg-red-500/20', border: 'border-red-500/50', gradient: 'from-red-500 to-pink-500' },
    'Cyan': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', gradient: 'from-cyan-500 to-blue-500' },
    'Purple': { bg: 'bg-purple-500/20', border: 'border-purple-500/50', gradient: 'from-purple-500 to-violet-500' },
    'Blue': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', gradient: 'from-blue-500 to-indigo-500' },
    'Green': { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', gradient: 'from-emerald-500 to-green-500' },
    'Gray': { bg: 'bg-neutral-500/20', border: 'border-neutral-500/50', gradient: 'from-neutral-500 to-gray-500' },
};

export function StyleCard({ style, songCount, promptCount, onEdit }: StyleCardProps) {
    const color = colorConfig[style.color_tag] || colorConfig['Gray'];

    return (
        <div
            onClick={() => onEdit(style.style_id)}
            className={`
                group relative overflow-hidden cursor-pointer
                bg-gradient-to-br from-neutral-800/80 to-neutral-900/90
                backdrop-blur-sm
                border ${color.border}
                rounded-2xl
                shadow-xl hover:shadow-2xl
                transition-all duration-300
                hover:translate-y-[-2px]
            `}
        >
            {/* Color Banner */}
            <div className={`h-2 bg-gradient-to-r ${color.gradient}`} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className={`
                        w-14 h-14 rounded-xl flex-shrink-0
                        bg-gradient-to-br ${color.gradient}
                        flex items-center justify-center
                        shadow-lg
                    `}>
                        <Palette size={24} className="text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg mb-1">
                            {style.style_name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-neutral-400">
                            <span className="flex items-center gap-1">
                                <Music size={12} />
                                {songCount} songs
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {promptCount} prompts
                            </span>
                        </div>
                    </div>

                    {/* Status */}
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${style.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-500/20 text-neutral-400'
                        }`}>
                        {style.status}
                    </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black/20 rounded-xl px-3 py-2 border border-white/5">
                        <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                            <Zap size={10} />
                            Tempo
                        </div>
                        <p className="text-white text-sm font-medium">{style.tempo_range}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl px-3 py-2 border border-white/5">
                        <div className="text-neutral-500 text-xs mb-1">Energy</div>
                        <p className="text-white text-sm font-medium">{style.energy_level}</p>
                    </div>
                </div>

                {/* Mood Keywords */}
                <div className="mb-4">
                    <p className="text-neutral-500 text-xs mb-2">Mood</p>
                    <div className="flex flex-wrap gap-1.5">
                        {style.mood_keywords.split(',').slice(0, 4).map((keyword, i) => (
                            <span key={i} className={`${color.bg} text-white/80 text-xs px-2 py-1 rounded-md`}>
                                {keyword.trim()}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Reference Artists */}
                {style.reference_artists && (
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Users size={14} />
                        <span className="truncate">{style.reference_artists}</span>
                    </div>
                )}

                {/* Use Cases */}
                {style.use_cases && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-neutral-500 text-xs line-clamp-1">{style.use_cases}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
