import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROMPTS_DB_PATH = path.join(process.cwd(), '..', '_database', 'prompts.json');
const STYLES_DB_PATH = path.join(process.cwd(), '..', '_database', 'styles.json');

interface Prompt {
    prompt_id: string;
    style_id: string;
    prompt_name: string;
    full_prompt_text: string;
    tempo_bpm: number;
    structure: string;
    purpose: string;
    target_platforms: string;
    status: 'Draft' | 'Testing' | 'Validated' | 'Archived';
    performance_rating: number;
    created_date: string;
    last_used_date: string;
    times_used: number;
    notes: string;
    lyrics?: string;
}

interface Style {
    style_id: string;
    style_name: string;
    color_tag: string;
}

function readPromptsDB(): Prompt[] {
    try {
        const data = fs.readFileSync(PROMPTS_DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function readStylesDB(): Style[] {
    try {
        const data = fs.readFileSync(STYLES_DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writePromptsDB(data: Prompt[]): void {
    fs.writeFileSync(PROMPTS_DB_PATH, JSON.stringify(data, null, 4), 'utf-8');
}

function generateId(prompts: Prompt[]): string {
    const maxId = prompts.reduce((max, p) => {
        const num = parseInt(p.prompt_id.replace('PROMPT_', ''), 10);
        return num > max ? num : max;
    }, 0);
    return `PROMPT_${String(maxId + 1).padStart(3, '0')}`;
}

// GET - Fetch all prompts with style info
export async function GET() {
    const prompts = readPromptsDB();
    const styles = readStylesDB();

    const enrichedPrompts = prompts.map(prompt => {
        const style = styles.find(s => s.style_id === prompt.style_id);
        return {
            ...prompt,
            style_name: style?.style_name || 'Unknown Style',
            style_color: style?.color_tag || 'Gray'
        };
    });

    return NextResponse.json(enrichedPrompts);
}

// POST - Create new prompt
export async function POST(request: NextRequest) {
    const body = await request.json();
    const prompts = readPromptsDB();

    const newPrompt: Prompt = {
        prompt_id: generateId(prompts),
        style_id: body.style_id || 'STYLE_001',
        prompt_name: body.prompt_name || '',
        full_prompt_text: body.full_prompt_text || '',
        tempo_bpm: body.tempo_bpm || 100,
        structure: body.structure || '',
        purpose: body.purpose || 'Production',
        target_platforms: body.target_platforms || '',
        status: body.status || 'Draft',
        performance_rating: body.performance_rating || 5,
        created_date: new Date().toISOString().split('T')[0],
        last_used_date: new Date().toISOString().split('T')[0],
        times_used: 0,
        notes: body.notes || '',
        lyrics: body.lyrics || ''
    };

    prompts.push(newPrompt);
    writePromptsDB(prompts);

    return NextResponse.json(newPrompt, { status: 201 });
}

// PUT - Update prompt
export async function PUT(request: NextRequest) {
    const body = await request.json();
    const prompts = readPromptsDB();

    const index = prompts.findIndex(p => p.prompt_id === body.prompt_id);
    if (index === -1) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Increment times_used if copying/using
    if (body.incrementUse) {
        prompts[index].times_used = (prompts[index].times_used || 0) + 1;
        prompts[index].last_used_date = new Date().toISOString().split('T')[0];
        delete body.incrementUse;
    }

    prompts[index] = { ...prompts[index], ...body };
    writePromptsDB(prompts);

    return NextResponse.json(prompts[index]);
}

// DELETE - Remove prompt
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const prompts = readPromptsDB();
    const filtered = prompts.filter(p => p.prompt_id !== id);

    if (filtered.length === prompts.length) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    writePromptsDB(filtered);
    return NextResponse.json({ success: true });
}
