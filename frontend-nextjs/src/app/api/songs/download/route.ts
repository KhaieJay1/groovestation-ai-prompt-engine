import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCollection, saveItem } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { song_id, audio_url, title } = await request.json();

        if (!song_id || !audio_url) {
            return NextResponse.json({ error: 'Missing song_id or audio_url' }, { status: 400 });
        }

        console.log(`Downloading ${title} (${song_id})...`);

        // Fetch the audio file
        const response = await fetch(audio_url);
        if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Ensure downloads dir exists
        const downloadsDir = path.join(process.cwd(), '../_database/downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        // Save file
        const safeTitle = (title || 'song').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${safeTitle}_${song_id}.mp3`;
        const filePath = path.join(downloadsDir, fileName);

        fs.writeFileSync(filePath, buffer);

        // Update DB
        const songs = await getCollection('songs');
        const songIndex = songs.findIndex((s: any) => s.song_id === song_id);

        if (songIndex >= 0) {
            songs[songIndex].local_file_path = filePath;
            songs[songIndex].download_status = "Downloaded";
            // Also update duration if possible (would need metadata probe, skipping for now)
            await saveItem('songs', songs[songIndex]);
        }

        return NextResponse.json({ success: true, filePath });

    } catch (error: any) {
        console.error('Download Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
