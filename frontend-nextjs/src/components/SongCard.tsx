"use client";
import React from 'react';
import { Music, ExternalLink, Star, Clock, CheckCircle, Download, Youtube, Calendar } from 'lucide-react';

interface SongCardProps {
    song: {
        song_id: string;
        title?: string;
        style_name: string;
        style_color: string;
        suno_link: string;
        generated_date: string;
        duration_seconds: number;
        subjective_rating: number;
        similarity_tag: string;
        approved_for_release: boolean;
        platform_youtube: string;
        download_status: string;
        notes: string;
    };
    onEdit: (id: string) => void;
}

const colorConfig: Record<string, { bg: string; text: string; glow: string }> = {
    'Gold': { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    'Yellow': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
    'Red': { bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/20' },
    'Cyan': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    'Purple': { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    'Blue': { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    'Green': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    'Gray': { bg: 'bg-neutral-500/20', text: 'text-neutral-400', glow: 'shadow-neutral-500/20' },
};

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function RatingStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    size={14}
                    className={i <= Math.round(rating / 2) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'}
                />
            ))}
            <span className="text-neutral-400 text-xs ml-1">{rating}/10</span>
        </div>
    );
}

export function SongCard({ song, onEdit }: SongCardProps) {
    const color = colorConfig[song.style_color] || colorConfig['Gray'];

    return (
        <div
            onClick={() => onEdit(song.song_id)}
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
        >
            {/* Approval Status Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 
                ${song.approved_for_release
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-neutral-600 to-neutral-500'}`}
            />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    {/* Album Art Placeholder */}
                    <div className={`
                        w-16 h-16 rounded-xl flex-shrink-0
                        ${color.bg} 
                        flex items-center justify-center
                        border border-white/5
                    `}>
                        <Music size={28} className={color.text} />
                    </div>

                    {/* Title & Style */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate mb-1">
                            {song.title || song.song_id}
                        </h3>
                        <p className={`${color.text} text-sm font-medium`}>{song.style_name}</p>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1.5 text-neutral-400 text-sm flex-shrink-0">
                        <Clock size={14} />
                        <span>{formatDuration(song.duration_seconds)}</span>
                    </div>
                </div>

                {/* Rating */}
                <div className="mb-4">
                    <RatingStars rating={song.subjective_rating} />
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {/* Approval Badge */}
                    <span className={`
                        flex items-center gap-1.5
                        text-xs font-medium
                        px-3 py-1.5 rounded-lg
                        border border-white/5
                        ${song.approved_for_release
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-neutral-500/20 text-neutral-400'}
                    `}>
                        <CheckCircle size={12} />
                        {song.approved_for_release ? 'Approved' : 'Pending'}
                    </span>

                    {/* Download Status */}
                    <span className={`
                        flex items-center gap-1.5
                        text-xs font-medium
                        px-3 py-1.5 rounded-lg
                        border border-white/5
                        ${song.download_status === 'Downloaded'
                            ? 'bg-blue-500/20 text-blue-400'
                            : song.download_status === 'Failed'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-neutral-500/20 text-neutral-400'}
                    `}>
                        <Download size={12} />
                        {song.download_status}
                    </span>

                    {/* YouTube if present */}
                    {song.platform_youtube && (
                        <a
                            href={song.platform_youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/5 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                        >
                            <Youtube size={12} />
                            YouTube
                        </a>
                    )}
                </div>

                {/* Similarity Tag */}
                {song.similarity_tag && (
                    <div className="bg-black/20 rounded-xl px-4 py-3 mb-4 border border-white/5">
                        <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1">Series</p>
                        <p className="text-white text-sm font-medium">{song.similarity_tag}</p>
                    </div>
                )}

                {/* Notes Preview */}
                {song.notes && (
                    <p className="text-neutral-400 text-sm line-clamp-2 mb-4">
                        {song.notes}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
                        <Calendar size={12} />
                        <span>{song.generated_date}</span>
                    </div>

                    {song.suno_link && (
                        <a
                            href={song.suno_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
                        >
                            <ExternalLink size={12} />
                            Suno
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
