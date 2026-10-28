import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { catalog, bpm_min, bpm_max, track_number } = await request.json();

    const prompt = `Generate a ${catalog} instrumental music prompt for Suno.ai:
    - BPM: ${bpm_min}-${bpm_max}
    - Track number: ${track_number}
    - Must be 100% instrumental (NO vocals, NO lyrics, NO vocal chops)
    - Include: BPM, key, mood, lead instrument
    - Format as JSON: {prompt_text, bpm, key, mood, lead_instrument}`;

    const OLLAMA_URL = 'http://localhost:11434/api/generate';

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2:3b',
                prompt: prompt,
                stream: false,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Parse JSON from response
        // Sometimes Ollama adds text before/after, so we look for the JSON block
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        const promptData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (!promptData) {
            throw new Error("Could not parse JSON from AI response");
        }

        return NextResponse.json(promptData);
    } catch (error: any) {
        console.error("Ollama Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
