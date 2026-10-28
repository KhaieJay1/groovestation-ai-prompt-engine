import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import { Song, Style } from '../types/db';

// Configure Database Path
const DESKTOP_DB = path.join(os.homedir(), 'Desktop', 'BussGroove', 'Database', 'bussgroove_master.db');
const LOCAL_DB_DIR = path.resolve(process.cwd(), '..', '_database');
const LOCAL_DB = path.join(LOCAL_DB_DIR, 'bussgroove_master.db');

let DB_PATH = LOCAL_DB;
try {
    DB_PATH = LOCAL_DB;
    console.log(`[DB] Selected Database: ${DB_PATH}`);
} catch (e) {
    console.error("[DB] Error resolving path", e);
}

let db: any = null;

function getDb() {
    if (!db) {
        try {
            console.log(`[DB] Opening connection to ${DB_PATH}`);
            db = new Database(DB_PATH, { verbose: console.log });
            db.pragma('journal_mode = WAL');
        } catch (err) {
            console.error('[DB] Failed to open database:', err);
            throw err;
        }
    }
    return db;
}

const TABLE_MAP: Record<string, string> = {
    'songs': 'master_tracks',
    'tracks': 'master_tracks',
    'playlists': 'playlists',
    'styles': 'styles',
    'channels': 'channels',
    'legacy_optimization': 'legacy_optimization'
};

export const getCollection = async <T = any>(collectionName: string): Promise<T[]> => {
    const database = getDb();
    const tableName = TABLE_MAP[collectionName] || collectionName;

    try {
        if (collectionName === 'songs') {
            const stmt = database.prepare(`
                SELECT 
                    track_id as song_id, 
                    youtube_title as title,
                    collection as style_id,
                    'STYLE_001' as prompt_version_id,
                    suno_prompt as notes,
                    status as download_status,
                    created_at as generated_date,
                    bpm as duration_seconds,
                    * 
                FROM master_tracks
             `);
            return stmt.all() as T[];
        }

        const stmt = database.prepare(`SELECT * FROM ${tableName}`);
        return stmt.all() as T[];
    } catch (error) {
        console.error(`[DB] Error reading ${collectionName} (table: ${tableName}):`, error);
        return [];
    }
};

export const saveItem = async (collectionName: string, item: any): Promise<boolean> => {
    const database = getDb();
    const tableName = TABLE_MAP[collectionName] || collectionName;

    try {
        const keys = Object.keys(item);
        const placeholders = keys.map(() => '?').join(',');
        const updates = keys.map(k => `${k}=excluded.${k}`).join(',');

        const sql = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders}) 
                     ON CONFLICT DO UPDATE SET ${updates}`;

        const stmt = database.prepare(sql);
        stmt.run(...Object.values(item));
        return true;
    } catch (error) {
        console.error(`[DB] Error saving to ${collectionName}:`, error);
        return false;
    }
};
