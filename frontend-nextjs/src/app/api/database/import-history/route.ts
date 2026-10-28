import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const LOCAL_DB_DIR = path.resolve(process.cwd(), '..', '_database');
const LOCAL_DB = path.join(LOCAL_DB_DIR, 'bussgroove_master.db');

export async function POST(req: Request) {
    try {
        const db = new Database(LOCAL_DB);

        const body = await req.json();
        const videos = body.videos;

        if (!videos || !Array.isArray(videos)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        let updatedCount = 0;

        const updateStmt = db.prepare(`
            UPDATE playlists 
            SET youtube_title = ?, 
                youtube_link = ?, 
                upload_date = ?, 
                status = ?,
                confirmed_by_user = 1,
                confirmed_at = datetime('now')
            WHERE name = ?
        `);

        // Use transaction for better performance and atomicity
        const processVideos = db.transaction((videoList) => {
            for (const video of videoList) {
                if (video.playlistName) {
                    const status = (video.status === 'Published' || video.status === 'Public') ? 'completed' : 'scheduled';
                    const result = updateStmt.run(video.title, video.link, video.date, status, video.playlistName);
                    if (result.changes > 0) updatedCount++;
                }
            }
        });

        processVideos(videos);

        return NextResponse.json({ message: `Processed ${videos.length} videos. Updated ${updatedCount}.` });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
