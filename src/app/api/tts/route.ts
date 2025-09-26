
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return new NextResponse(JSON.stringify({ error: 'Text is required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "shimmer",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error('TTS Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(JSON.stringify({ error: 'Failed to generate audio', details: errorMessage }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
