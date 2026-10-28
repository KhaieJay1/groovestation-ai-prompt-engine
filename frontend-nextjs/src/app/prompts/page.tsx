"use client";
import React, { useEffect, useState } from 'react';
import { FileText, Plus, Copy, Play } from 'lucide-react';
import Link from 'next/link';

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<any[]>([]);
    const [styles, setStyles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/data?type=prompts').then(res => res.json()),
            fetch('/api/data?type=styles').then(res => res.json())
        ]).then(([promptsData, stylesData]) => {
            setPrompts(promptsData);
            setStyles(stylesData);
            setLoading(false);
        });
    }, []);

    const handleGenerate = async (prompt: any) => {
        if (generatingId) return;
        setGeneratingId(prompt.prompt_id);

        try {
            // Find style tags
            const style = styles.find(s => s.style_id === prompt.style_id);
            const styleTags = style ? `${style.style_name} ${style.mood_keywords}` : "Afro House";

            const res = await fetch('/api/suno/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt.full_prompt_text,
                    style: styleTags,
                    title: prompt.prompt_name,
                    instrumental: false
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            alert(`Started Generation! IDs: ${data.map((d: any) => d.id).join(', ')}`);

            // Auto-save to DB as pending
            const newSongs = data.map((d: any) => ({
                song_id: d.id,
                title: prompt.prompt_name,
                style_id: prompt.style_id,
                style_name: style?.style_name || 'Legacy',
                style_color: style?.color_tag || 'Gray',
                suno_link: `https://suno.com/song/${d.id}`,
                generated_date: new Date().toISOString(),
                duration_seconds: 0,
                subjective_rating: 0,
                similarity_tag: "",
                approved_for_release: false,
                release_date: "",
                platform_youtube: "",
                platform_spotify: "",
                download_status: "Pending",
                local_file_path: "",
                notes: "Auto-generated via API"
            }));

            for (const song of newSongs) {
                await fetch('/api/songs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(song)
                });
            }

        } catch (err: any) {
            alert('Generation Failed: ' + err.message);
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Prompt Library</h1>
                <button className="bg-spotify-green text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition flex items-center gap-2">
                    <Plus size={20} /> New Prompt
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm text-spotify-text-secondary collapse-separate border-spacing-y-2">
                    <thead>
                        <tr className="border-b border-spotify-light-gray text-xs uppercase tracking-wider">
                            <th className="pb-2 w-10">#</th>
                            <th className="pb-2">Name</th>
                            <th className="pb-2">Style</th>
                            <th className="pb-2">Tags</th>
                            <th className="pb-2 text-right">Rating</th>
                            <th className="pb-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} className="text-center py-10">Loading...</td></tr> :
                            prompts.map((prompt, i) => (
                                <PromptRow
                                    key={prompt.prompt_id}
                                    i={i + 1}
                                    prompt={prompt}
                                    onGenerate={() => handleGenerate(prompt)}
                                    isGenerating={generatingId === prompt.prompt_id}
                                />
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PromptRow({ i, prompt, onGenerate, isGenerating }: any) {
    return (
        <tr className="bg-spotify-light-gray/20 hover:bg-spotify-light-gray transition group rounded-md">
            <td className="py-3 pl-3 rounded-l-md">{i}</td>
            <td className="py-3 font-medium text-white">
                <div className="flex flex-col">
                    <span>{prompt.prompt_name}</span>
                    <span className="text-xs text-spotify-text-secondary line-clamp-1 opacity-70">{prompt.full_prompt_text}</span>
                </div>
            </td>
            <td className="py-3">{prompt.style_id}</td>
            <td className="py-3">
                <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded text-xs border border-white/10">{prompt.purpose}</span>
            </td>
            <td className="py-3 text-right font-bold text-spotify-green">{prompt.performance_rating}/10</td>
            <td className="py-3 pr-3 text-right rounded-r-md">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button className="p-2 hover:bg-white/10 rounded-full" title="Copy to Clipboard">
                        <Copy size={16} className="text-white" />
                    </button>
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className={`p-2 hover:bg-white/10 rounded-full ${isGenerating ? 'animate-spin' : ''}`}
                        title="Auto-Generate (Suno API)"
                    >
                        <Play size={16} className={isGenerating ? "text-neutral-500" : "text-spotify-green"} fill={isGenerating ? "none" : "currentColor"} />
                    </button>
                </div>
            </td>
        </tr>
    )
}
