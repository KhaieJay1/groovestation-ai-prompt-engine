
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const LOCAL_DB_DIR = path.resolve(process.cwd(), '..', '_database');
const LOCAL_DB = path.join(LOCAL_DB_DIR, 'bussgroove_master.db');

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Playlist ID required' }, { status: 400 });
    }

    try {
        const db = new Database(LOCAL_DB);

        // Get the specific playlist
        const playlist = db.prepare(`
            SELECT 
                p.*,
                c.name as catalog_name,
                c.color_hex
            FROM playlists p
            JOIN catalogs c ON p.catalog_id = c.id
            WHERE p.id = ?
        `).get(id) as any;

        if (playlist) {
            // Get prompts for this playlist
            const prompts = db.prepare(`
                SELECT * FROM prompts
                WHERE playlist_id = ?
                ORDER BY track_number ASC
            `).all(playlist.id);

            return NextResponse.json({
                playlist: playlist,
                prompts: prompts || []
            });
        }

        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });

    } catch (error: any) {
        console.error("Database Query Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
