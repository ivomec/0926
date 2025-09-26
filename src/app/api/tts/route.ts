
import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Google Cloud 클라이언트 초기화
const ttsClient = new TextToSpeechClient();

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return new NextResponse(JSON.stringify({ error: 'Text is required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Google Cloud TTS 요청 객체 구성
    const ttsRequest = {
      input: { text },
      // 가장 자연스러운 한국어 여성 음성 (Neural2)
      voice: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-A' }, 
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    // TTS API 호출
    const [response] = await ttsClient.synthesizeSpeech(ttsRequest);
    
    if (!response.audioContent) {
        throw new Error('Audio content is null or undefined');
    }

    // Buffer로 변환하여 응답
    const audioBuffer = Buffer.from(response.audioContent);

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error('Google TTS Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(JSON.stringify({ error: 'Failed to generate audio', details: errorMessage }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
