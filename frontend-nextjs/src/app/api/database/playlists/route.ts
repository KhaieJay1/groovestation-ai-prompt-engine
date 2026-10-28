
import { type NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const playlists = await getCollection('playlists');
        const catalogs = await getCollection('catalogs'); // Fetch catalogs too

        // Create a map of ID -> Name/Slug
        const catalogMap = catalogs.reduce((acc: any, c: any) => {
            acc[c.id] = c.name; // Use Name for UI Grouping
            return acc;
        }, {});

        const mapped = playlists.map((p: any) => ({
            ...p,
            playlist_id: p.id,
            playlist_name: p.name,
            track_count_goal: p.tracks_total,
            // Use real catalog name from DB, fallback to 'Uncategorized'
            catalog_name: catalogMap[p.catalog_id] || 'Uncategorized',
            // Keep catalog slug for potential logic if needed
            catalog: catalogMap[p.catalog_id] // or slug 
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
    }
}
