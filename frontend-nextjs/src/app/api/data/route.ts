import { NextResponse } from 'next/server';
import { getCollection, saveItem } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Accept both 'file' and 'type' for backwards compatibility
    const type = searchParams.get('type') || searchParams.get('file');

    if (!type) return NextResponse.json({ error: 'Missing type param' }, { status: 400 });

    const data = await getCollection(type);
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, item } = body;

        if (!type || !item) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        await saveItem(type, item);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Save failed' }, { status: 500 });
    }
}
