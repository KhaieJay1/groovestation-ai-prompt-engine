import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Duplicate DB setup to ensure standalone operation (or we could export getDb from lib/db)
const LOCAL_DB_DIR = path.resolve(process.cwd(), '..', '_database');
const LOCAL_DB = path.join(LOCAL_DB_DIR, 'bussgroove_master.db');

export async function GET() {
    console.log('[API] KPIs requested');

    try {
        const db = new Database(LOCAL_DB);

        const kpis: any = {
            overview: {},
            youtube: {},
            monthly: {}
        };

        // 1. Overview Stats
        const overview = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress
            FROM playlists
        `).get() as any;  // Added type assertion

        if (overview) {
            kpis.overview.playlists_total = overview.total;
            kpis.overview.playlists_completed = overview.completed;
            kpis.overview.playlists_in_progress = overview.in_progress;
            kpis.overview.tracks_goal = overview.total * 20;
            kpis.overview.tracks_uploaded = overview.completed * 20;
        }

        // 2. YouTube Performance
        // Check for view_count column first? Assuming failure if not present.
        try {
            const topVideo = db.prepare(`
                SELECT youtube_title, view_count, youtube_link 
                FROM playlists 
                WHERE status='completed' AND view_count IS NOT NULL 
                ORDER BY view_count DESC LIMIT 1
            `).get() as any; // Added type assertion

            if (topVideo) {
                kpis.youtube.top_video = topVideo.youtube_title;
            } else {
                kpis.youtube.top_video = "No data";
            }

            const totalStats = db.prepare(`
                SELECT COUNT(*) as count, SUM(view_count) as views 
                FROM playlists 
                WHERE status='completed'
            `).get() as any; // Added type assertion

            kpis.youtube.total_videos = totalStats?.count || 0;
            kpis.youtube.total_views = totalStats?.views || 0;

        } catch (e) {
            console.log('YouTube stats query failed (likely schema mismatch):', e);
            kpis.youtube.error = "YouTube stats unavailable";
        }

        return NextResponse.json(kpis);

    } catch (err) {
        console.error('[API] KPI Error:', err);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}
