import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '..', '_database', 'inspirations.json');

interface Inspiration {
    inspiration_id: string;
    source_title: string;
    source_artist: string;
    source_link: string;
    discovered_date: string;
    last_listened: string;
    why_i_like_it: string;
    what_to_use: string;
    tags: string[];
    detailed_notes: string;
    target_vibe: string;
    priority: number;
    status: 'new' | 'in_progress' | 'developed' | 'archived';
    developed_song_id: string | null;
}

function readDB(): Inspiration[] {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeDB(data: Inspiration[]): void {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 4), 'utf-8');
}

function generateId(inspirations: Inspiration[]): string {
    const maxId = inspirations.reduce((max, insp) => {
        const num = parseInt(insp.inspiration_id.replace('INSP_', ''), 10);
        return num > max ? num : max;
    }, 0);
    return `INSP_${String(maxId + 1).padStart(3, '0')}`;
}

// GET - Fetch all inspirations
export async function GET() {
    const inspirations = readDB();
    return NextResponse.json(inspirations);
}

// POST - Create new inspiration
export async function POST(request: NextRequest) {
    const body = await request.json();
    const inspirations = readDB();

    const newInspiration: Inspiration = {
        inspiration_id: generateId(inspirations),
        source_title: body.source_title || '',
        source_artist: body.source_artist || '',
        source_link: body.source_link || '',
        discovered_date: new Date().toISOString().split('T')[0],
        last_listened: new Date().toISOString().split('T')[0],
        why_i_like_it: body.why_i_like_it || '',
        what_to_use: body.what_to_use || 'vibe',
        tags: body.tags || [],
        detailed_notes: body.detailed_notes || '',
        target_vibe: body.target_vibe || 'Lounge Vibes',
        priority: body.priority || 3,
        status: 'new',
        developed_song_id: null
    };

    inspirations.push(newInspiration);
    writeDB(inspirations);

    return NextResponse.json(newInspiration, { status: 201 });
}

// PUT - Update inspiration
export async function PUT(request: NextRequest) {
    const body = await request.json();
    const inspirations = readDB();

    const index = inspirations.findIndex(i => i.inspiration_id === body.inspiration_id);
    if (index === -1) {
        return NextResponse.json({ error: 'Inspiration not found' }, { status: 404 });
    }

    inspirations[index] = { ...inspirations[index], ...body };
    writeDB(inspirations);

    return NextResponse.json(inspirations[index]);
}

// DELETE - Remove inspiration
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const inspirations = readDB();
    const filtered = inspirations.filter(i => i.inspiration_id !== id);

    if (filtered.length === inspirations.length) {
        return NextResponse.json({ error: 'Inspiration not found' }, { status: 404 });
    }

    writeDB(filtered);
    return NextResponse.json({ success: true });
}
