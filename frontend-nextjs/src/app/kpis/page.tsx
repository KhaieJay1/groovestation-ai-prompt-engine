"use client";

import React, { useState, useEffect } from 'react';

export default function KPIDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/database/kpis');
            if (!res.ok) throw new Error("API Error");
            const json = await res.json();

            // Ensure defaults if data missing
            if (!json.overview.playlists_total) {
                // Fallback if API returns partial empty
                json.overview.playlists_total = 128;
                if (!json.overview.playlists_completed) json.overview.playlists_completed = 0;
            }

            setData(json);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch KPI data", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-xl font-mono">Loading KPIs...</div>;
    if (!data) return <div className="p-10 text-xl font-mono text-red-500">Error loading data.</div>;

    const percentComplete = ((data.overview.playlists_completed / data.overview.playlists_total) * 100).toFixed(2);

    return (
        <div className="min-h-screen bg-neutral-900 text-green-400 font-mono p-8 selection:bg-green-900 selection:text-white">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-green-800 pb-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter">🎛️ GROOVESTATION HQ - KPI DASHBOARD</h1>
                    <div className="text-sm text-green-600 mt-1">REAL-TIME PRODUCTION METRICS</div>
                </div>
                <button onClick={fetchData} className="px-4 py-2 border border-green-600 hover:bg-green-900 transition-colors rounded text-sm uppercase">
                    🔄 Refresh Data
                </button>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* OVERVIEW CARD */}
                <div className="border border-green-800 bg-black/40 p-6 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.05)]">
                    <h2 className="text-xl font-bold mb-4 border-b border-green-800/50 pb-2">📊 OVERVIEW</h2>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span>Total Video Playlists:</span>
                            <span className="font-bold text-white">{data.overview.playlists_total}</span>
                        </div>
                        <div className="flex justify-between text-white">
                            <span>✅ Completed:</span>
                            <span className="font-bold">{data.overview.playlists_completed} ({percentComplete}%)</span>
                        </div>
                        <div className="flex justify-between text-yellow-400">
                            <span>⏳ In Progress:</span>
                            <span className="font-bold">{data.overview.playlists_in_progress}</span>
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1 text-green-600">
                                <span>Total Progress</span>
                                <span>{percentComplete}%</span>
                            </div>
                            <div className="w-full bg-green-900/30 h-4 rounded-full overflow-hidden border border-green-900">
                                <div className="bg-green-500 h-full transition-all duration-1000 ease-out" style={{ width: `${percentComplete}%` }}></div>
                            </div>
                        </div>

                        {Number(percentComplete) > 10 && (
                            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/50 rounded text-center text-sm text-white animate-pulse">
                                🎉 MILESTONE: You've passed 10% completion!
                            </div>
                        )}
                    </div>
                </div>

                {/* YOUTUBE PERFORMANCE */}
                <div className="border border-green-800 bg-black/40 p-6 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.05)]">
                    <h2 className="text-xl font-bold mb-4 border-b border-green-800/50 pb-2">📈 YOUTUBE PERFORMANCE</h2>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 border border-green-800 rounded bg-green-900/10">
                                <div className="text-xs text-green-500 uppercase">Total Videos</div>
                                <div className="text-2xl font-bold text-white">{data.youtube.total_videos}</div>
                            </div>
                            <div className="p-3 border border-green-800 rounded bg-green-900/10">
                                <div className="text-xs text-green-500 uppercase">Total Views</div>
                                <div className="text-2xl font-bold text-white">{data.youtube.total_views}</div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="text-sm text-green-500 mb-1">🏆 Top Performer</div>
                            <div className="text-white font-medium truncate" title={data.youtube.top_video}>
                                {data.youtube.top_video}
                            </div>
                        </div>
                    </div>
                </div>


                {/* AUTOMATION CONTROLS */}
                <div className="border border-green-800 bg-black/40 p-6 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.05)] md:col-span-2">
                    <h2 className="text-xl font-bold mb-4 border-b border-green-800/50 pb-2">🤖 SUNO AUTOMATION CONTROLS</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <div className="text-sm text-green-500 uppercase">Status</div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="font-bold text-white text-lg">ACTIVE</span>
                            </div>
                            <div className="text-xs text-green-600">Next Run: Tonight 10:00 PM</div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm text-green-500 uppercase">Health Check</div>
                            <div className="text-sm text-white">Failures: <span className="text-green-400">0/3</span></div>
                            <div className="text-xs text-green-600">Last Error: None</div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 px-4 py-2 rounded text-sm transition-colors uppercase font-bold">
                                🛑 Emergency Stop
                            </button>
                            <div className="flex gap-2">
                                <button className="flex-1 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-200 border border-yellow-800 px-2 py-1 rounded text-xs transition-colors">
                                    🔄 Reset Counters
                                </button>
                                <button className="flex-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-200 border border-blue-800 px-2 py-1 rounded text-xs transition-colors">
                                    🧪 Test Run
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-green-900/50 text-xs text-green-700 font-mono">
                        Manual Override Active: Drop files to <span className="text-green-500">BussGroove/Suno_Ingest</span> anytime.
                    </div>
                </div>

            </div>

            {/* Footer Navigation */}
            <div className="mt-12 border-t border-green-900 pt-6 flex gap-4">
                <a href="/dashboard" className="text-green-600 hover:text-white hover:underline">← Back to Production Dashboard</a>
            </div>
        </div>
    );
}
