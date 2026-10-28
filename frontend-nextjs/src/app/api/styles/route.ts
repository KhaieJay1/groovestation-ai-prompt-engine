import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '..', '_database', 'styles.json');

interface Style {
    style_id: string;
    style_name: string;
    tempo_range: string;
    energy_level: string;
    mood_keywords: string;
    instrumentation_include: string;
    instrumentation_exclude: string;
    bass_style: string;
    vocal_style: string;
    reference_artists: string;
    color_tag: string;
    use_cases: string;
    notes: string;
    created_date: string;
    status: string;
}

function readDB(): Style[] {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeDB(data: Style[]): void {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(styles: Style[]): string {
    const maxId = styles.reduce((max, s) => {
        const num = parseInt(s.style_id.replace('STYLE_', ''), 10);
        return num > max ? num : max;
    }, 0);
    return `STYLE_${String(maxId + 1).padStart(3, '0')}`;
}

// GET - Fetch all styles
export async function GET() {
    const styles = readDB();
    return NextResponse.json(styles);
}

// POST - Create new style
export async function POST(request: NextRequest) {
    const body = await request.json();
    const styles = readDB();

    const newStyle: Style = {
        style_id: generateId(styles),
        style_name: body.style_name || '',
        tempo_range: body.tempo_range || '',
        energy_level: body.energy_level || '',
        mood_keywords: body.mood_keywords || '',
        instrumentation_include: body.instrumentation_include || '',
        instrumentation_exclude: body.instrumentation_exclude || '',
        bass_style: body.bass_style || '',
        vocal_style: body.vocal_style || '',
        reference_artists: body.reference_artists || '',
        color_tag: body.color_tag || 'Gray',
        use_cases: body.use_cases || '',
        notes: body.notes || '',
        created_date: new Date().toISOString().split('T')[0],
        status: body.status || 'Active'
    };

    styles.push(newStyle);
    writeDB(styles);

    return NextResponse.json(newStyle, { status: 201 });
}

// PUT - Update style
export async function PUT(request: NextRequest) {
    const body = await request.json();
    const styles = readDB();

    const index = styles.findIndex(s => s.style_id === body.style_id);
    if (index === -1) {
        return NextResponse.json({ error: 'Style not found' }, { status: 404 });
    }

    styles[index] = { ...styles[index], ...body };
    writeDB(styles);

    return NextResponse.json(styles[index]);
}

// DELETE - Remove style
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const styles = readDB();
    const filtered = styles.filter(s => s.style_id !== id);

    if (filtered.length === styles.length) {
        return NextResponse.json({ error: 'Style not found' }, { status: 404 });
    }

    writeDB(filtered);
    return NextResponse.json({ success: true });
}
