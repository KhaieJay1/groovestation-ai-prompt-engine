import { NextResponse } from 'next/server';

const SUNO_API_URL = 'http://localhost:3002';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
        return NextResponse.json({ error: 'Missing ids param' }, { status: 400 });
    }

    try {
        const res = await fetch(`${SUNO_API_URL}/api/get?ids=${ids}`);
        if (!res.ok) {
            throw new Error(`Suno API Error: ${res.statusText}`);
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
