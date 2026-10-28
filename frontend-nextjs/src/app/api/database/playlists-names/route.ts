import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { Playlist } from '@/types/db';

export async function GET() {
    try {
        // Use the centralized DB logic
        // We fetch all playlists and map to names
        const playlists = await getCollection<Playlist>('playlists');

        // Filter/Map as needed. The original code ordered by name.
        // getCollection returns all columns.
        const names = playlists
            .map(p => p.collection_name || p.name) // Handle distinct naming potentially
            .filter(Boolean)
            .sort();

        return NextResponse.json(names);
    } catch (err: any) {
        console.error("Error fetching playlist names:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
