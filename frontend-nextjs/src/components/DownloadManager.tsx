"use client";
import React, { useEffect, useState } from 'react';

export default function DownloadManager() {
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        const interval = setInterval(checkPendingDownloads, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const checkPendingDownloads = async () => {
        if (checking) return;
        setChecking(true);

        try {
            // 1. Get local songs that are Pending
            const res = await fetch('/api/data?type=songs');
            const songs = await res.json();
            const pendingSongs = songs.filter((s: any) => s.download_status === 'Pending' && s.song_id);

            if (pendingSongs.length === 0) {
                setChecking(false);
                return;
            }

            console.log(`Checking ${pendingSongs.length} pending songs...`);

            // 2. Check status with Suno API for these IDs
            const ids = pendingSongs.map((s: any) => s.song_id).join(',');
            // We need to proxy this request too ideally, or just fetch directly if CORS allows.
            // Let's use a new proxy route for 'get' or just try direct first. 
            // Actually, we can use the existing /api/suno/generate approach but we need a GET proxy.
            // For simplicity, let's assume we can fetch from the proxy we are about to make, 
            // OR we just make a quick client-side fetch to the proxy route we will create next.

            // Let's create a proxy for getting song info: /api/suno/get?ids=...
            const statusRes = await fetch(`/api/suno/get?ids=${ids}`);
            const statusData = await statusRes.json();

            if (!statusData || !Array.isArray(statusData)) {
                console.error("Invalid status data", statusData);
                setChecking(false);
                return;
            }

            // 3. Process matches
            for (const songInfo of statusData) {
                const localSong = pendingSongs.find((s: any) => s.song_id === songInfo.id);
                if (!localSong) continue;

                if (songInfo.audio_url) {
                    // It's ready! Trigger download
                    console.log(`Song Ready: ${localSong.title}. Downloading...`);

                    await fetch('/api/songs/download', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            song_id: songInfo.id,
                            audio_url: songInfo.audio_url,
                            title: localSong.title
                        })
                    });

                    // Update Metadata (duration, etc) - The download route handles the status update,
                    // but we might want to update other fields here or let the user do it.
                } else if (songInfo.status === 'error') {
                    // Mark as failed
                    // Call API to update localSong.download_status = "Failed"
                }
            }

        } catch (error) {
            console.error("Download Manager Error:", error);
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            {checking && (
                <div className="bg-spotify-card-bg border border-spotify-green text-xs text-spotify-green px-3 py-1 rounded-full shadow-lg animate-pulse">
                    Syncing Suno...
                </div>
            )}
        </div>
    );
}
