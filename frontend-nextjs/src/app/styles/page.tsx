"use client";
import React, { useEffect, useState } from 'react';
import { Music, ListMusic, CheckCircle, XCircle } from 'lucide-react';

interface Catalog {
    id: string;
    name: string;
    slug: string;
    description: string;
    tempo_range: string;
    energy_range: string;
    target_percentage: number;
    keys: string[];
    lead_instruments: string[];
    required_elements: string[];
    forbidden_elements: string[];
    mood_keywords: string[];
    color: string;
}

export default function CatalogsPage() {
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/data?file=styles')
            .then(res => res.json())
            .then(data => {
                setCatalogs(data);
                setLoading(false);
            });
    }, []);

    return (
        <div className="p-6 h-full overflow-auto" style={{ background: 'var(--bg-color)' }}>
            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h1 className="text-2xl font-bold text-white">Catalog Specifications</h1>
                    <p className="text-[var(--secondary-text)] text-sm">Your two instrumental catalogs with full spec sheets</p>
                </div>
            </div>

            {loading ? (
                <div className="text-[var(--secondary-text)]">Loading catalogs...</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {catalogs.map((catalog, index) => (
                        <CatalogCard key={catalog.id || catalog.slug || index} catalog={catalog} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CatalogCard({ catalog }: { catalog: Catalog }) {
    const IconComponent = (catalog.id === 'jazz-lofi' || catalog.slug === 'jazz-lofi') ? Music : ListMusic;

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background: catalog.color }}
                >
                    <IconComponent size={28} className="text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{catalog.name}</h2>
                    <p className="text-sm text-[var(--secondary-text)]">{catalog.description}</p>
                </div>
                <div
                    className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{ background: `${catalog.color}20`, color: catalog.color }}
                >
                    {catalog.target_percentage}%
                </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg-color)' }}>
                    <div className="text-xs text-[var(--secondary-text)] mb-1">Tempo Range</div>
                    <div className="text-white font-bold">{catalog.tempo_range}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg-color)' }}>
                    <div className="text-xs text-[var(--secondary-text)] mb-1">Energy Level</div>
                    <div className="text-white font-bold">{catalog.energy_range}</div>
                </div>
            </div>

            {/* Keys */}
            <div className="mb-4">
                <div className="text-xs text-[var(--secondary-text)] mb-2">Preferred Keys</div>
                <div className="flex flex-wrap gap-1">
                    {catalog.keys.map(key => (
                        <span key={key} className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'var(--bg-color)', color: catalog.color }}>
                            {key}
                        </span>
                    ))}
                </div>
            </div>

            {/* Lead Instruments */}
            <div className="mb-4">
                <div className="text-xs text-[var(--secondary-text)] mb-2">Lead Instruments</div>
                <div className="flex flex-wrap gap-1">
                    {catalog.lead_instruments.map(inst => (
                        <span key={inst} className="px-2 py-1 rounded text-xs bg-[var(--bg-color)] text-white">
                            {inst}
                        </span>
                    ))}
                </div>
            </div>

            {/* Required & Forbidden */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-xs text-[var(--secondary-text)] mb-2 flex items-center gap-1">
                        <CheckCircle size={12} className="text-green-500" /> Required
                    </div>
                    <ul className="text-xs text-[var(--secondary-text)] space-y-1">
                        {catalog.required_elements.slice(0, 4).map(el => (
                            <li key={el} className="truncate">• {el}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <div className="text-xs text-[var(--secondary-text)] mb-2 flex items-center gap-1">
                        <XCircle size={12} className="text-red-400" /> Forbidden
                    </div>
                    <ul className="text-xs text-[var(--secondary-text)] space-y-1">
                        {catalog.forbidden_elements.slice(0, 4).map(el => (
                            <li key={el} className="truncate">• {el}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Mood Keywords */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="text-xs text-[var(--secondary-text)] mb-2">Mood Keywords</div>
                <p className="text-xs" style={{ color: catalog.color }}>
                    {catalog.mood_keywords.join(' • ')}
                </p>
            </div>
        </div>
    );
}
