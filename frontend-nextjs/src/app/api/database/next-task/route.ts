import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const LOCAL_DB_DIR = path.resolve(process.cwd(), '..', '_database');
const LOCAL_DB = path.join(LOCAL_DB_DIR, 'bussgroove_master.db');

export async function GET() {
    try {
        const db = new Database(LOCAL_DB);

        // Get the next priority playlist
        const nextTask = db.prepare(`
            SELECT 
                p.*,
                c.name as catalog_name,
                c.color_hex,
                (p.tracks_total - p.tracks_completed) as remaining_tracks
            FROM playlists p
            JOIN catalogs c ON p.catalog_id = c.id
            WHERE p.render_status = 'pending'
            AND remaining_tracks > 0
            ORDER BY remaining_tracks ASC, p.due_date ASC
            LIMIT 1
        `).get() as any;

        if (nextTask) {
            // Get prompts for this playlist
            const prompts = db.prepare(`
                SELECT * FROM prompts
                WHERE playlist_id = ?
                ORDER BY track_number ASC
            `).all(nextTask.id);

            return NextResponse.json({
                playlist: nextTask,
                prompts: prompts || []
            });
        }

        return NextResponse.json({ playlist: null, prompts: [] });

    } catch (error: any) {
        console.error("Database Query Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
