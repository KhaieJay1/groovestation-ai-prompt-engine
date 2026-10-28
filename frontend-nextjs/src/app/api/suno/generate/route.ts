import { NextResponse } from 'next/server';

const SUNO_API_URL = 'http://localhost:3002';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt, style, title, instrumental } = body;

        // We use custom_generate to have control over style and lyrics (prompt)
        const payload = {
            prompt: prompt,       // Lyrics or description
            tags: style,          // Style/Mood
            title: title,
            make_instrumental: instrumental || false,
            wait_audio: false     // We will poll for it or let the user check back
        };

        console.log('Forwarding to Suno API:', payload);

        const res = await fetch(`${SUNO_API_URL}/api/custom_generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Suno API Error:', errorText);
            return NextResponse.json({ error: errorText }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
