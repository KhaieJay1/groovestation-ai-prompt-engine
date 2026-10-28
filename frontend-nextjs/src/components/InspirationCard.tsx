"use client";
import React from 'react';
import { Music, ExternalLink, ArrowRight, Edit2, Calendar, Clock } from 'lucide-react';

interface InspirationCardProps {
    inspiration: {
        inspiration_id: string;
        source_title: string;
        source_artist: string;
        source_link: string;
        discovered_date?: string;
        last_listened?: string;
        why_i_like_it: string;
        what_to_use?: string;
        tags: string[];
        target_vibe: string;
        priority: number;
        status: string;
    };
    onEdit: (id: string) => void;
    onDevelop: (id: string) => void;
}

const vibeConfig: Record<string, { bg: string; text: string; glow: string }> = {
    'Lounge Vibes': { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    'BrassGroove': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
    'Street Rhythm': { bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/20' },
    'Chill House': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    'Dark Grooves': { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    'new': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'New' },
    'in_progress': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
    'developed': { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Developed' },
    'archived': { bg: 'bg-neutral-500/20', text: 'text-neutral-400', label: 'Archived' },
};

const priorityConfig: Record<number, { icon: string; label: string; color: string }> = {
    1: { icon: '🔥', label: 'Urgent', color: 'text-red-400' },
    2: { icon: '⚡', label: 'High', color: 'text-orange-400' },
    3: { icon: '●', label: 'Normal', color: 'text-yellow-400' },
    4: { icon: '○', label: 'Low', color: 'text-neutral-400' },
    5: { icon: '◌', label: 'Later', color: 'text-neutral-500' },
};

export function InspirationCard({ inspiration, onEdit, onDevelop }: InspirationCardProps) {
    const vibe = vibeConfig[inspiration.target_vibe] || vibeConfig['Lounge Vibes'];
    const status = statusConfig[inspiration.status] || statusConfig['new'];
    const priority = priorityConfig[inspiration.priority] || priorityConfig[3];

    return (
        <div className={`
            group relative overflow-hidden
            bg-gradient-to-br from-neutral-800/80 to-neutral-900/90
            backdrop-blur-sm
            border border-neutral-700/50
            rounded-2xl
            shadow-xl hover:shadow-2xl ${vibe.glow}
            transition-all duration-300
            hover:border-neutral-600/70
            hover:translate-y-[-2px]
        `}>
            {/* Priority Indicator Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r 
                ${inspiration.priority === 1 ? 'from-red-500 to-orange-500' :
                    inspiration.priority === 2 ? 'from-orange-500 to-yellow-500' :
                        inspiration.priority === 3 ? 'from-yellow-500 to-green-500' :
                            'from-neutral-600 to-neutral-500'}`}
            />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    {/* Album Art Placeholder */}
                    <div className={`
                        w-14 h-14 rounded-xl flex-shrink-0
                        ${vibe.bg} 
                        flex items-center justify-center
                        border border-white/5
                    `}>
                        <Music size={24} className={vibe.text} />
                    </div>

                    {/* Title & Artist */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold text-lg truncate">
                                {inspiration.source_title}
                            </h3>
                            {inspiration.source_link && (
                                <a
                                    href={inspiration.source_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-500 hover:text-white transition flex-shrink-0 p-1 hover:bg-white/10 rounded-lg"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                        <p className="text-neutral-400 text-sm">{inspiration.source_artist || 'Unknown Artist'}</p>
                    </div>

                    {/* Priority Badge */}
                    <div className={`flex-shrink-0 ${priority.color} text-lg`} title={priority.label}>
                        {priority.icon}
                    </div>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {/* Vibe Badge */}
                    <span className={`
                        ${vibe.bg} ${vibe.text}
                        text-xs font-medium
                        px-3 py-1.5 rounded-lg
                        border border-white/5
                    `}>
                        {inspiration.target_vibe}
                    </span>

                    {/* Status Badge */}
                    <span className={`
                        ${status.bg} ${status.text}
                        text-xs font-medium
                        px-3 py-1.5 rounded-lg
                        border border-white/5
                    `}>
                        {status.label}
                    </span>

                    {/* What to Use */}
                    {inspiration.what_to_use && (
                        <span className="bg-white/5 text-neutral-400 text-xs px-3 py-1.5 rounded-lg border border-white/5">
                            {inspiration.what_to_use}
                        </span>
                    )}
                </div>

                {/* Why I Like It */}
                <div className="bg-black/20 rounded-xl p-4 mb-4 border border-white/5">
                    <p className="text-neutral-300 text-sm leading-relaxed line-clamp-2">
                        "{inspiration.why_i_like_it}"
                    </p>
                </div>

                {/* Tags */}
                {inspiration.tags.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {inspiration.tags.slice(0, 5).map((tag, i) => (
                            <span
                                key={i}
                                className="bg-white/5 text-neutral-400 text-xs px-2.5 py-1 rounded-md border border-white/5 hover:bg-white/10 transition"
                            >
                                #{tag}
                            </span>
                        ))}
                        {inspiration.tags.length > 5 && (
                            <span className="text-neutral-500 text-xs py-1">+{inspiration.tags.length - 5}</span>
                        )}
                    </div>
                )}

                {/* Footer with Date & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
                        <Calendar size={12} />
                        <span>{inspiration.discovered_date || 'No date'}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(inspiration.inspiration_id)}
                            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition"
                        >
                            <Edit2 size={12} /> Edit
                        </button>
                        <button
                            onClick={() => onDevelop(inspiration.inspiration_id)}
                            className="flex items-center gap-1.5 text-xs font-medium bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition"
                        >
                            Develop <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
