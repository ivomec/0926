import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';
import { VertexAI } from '@google-cloud/vertexai';

console.log("[API] AI 음성 분석 API 모듈 로딩됨 (Vertex AI)");

// Google Cloud Speech-to-Text 클라이언트 초기화
const speechClient = new SpeechClient({
  // 서비스 계정 키 파일 경로는 환경에 따라 자동으로 인식될 수 있습니다.
  // keyFilename: 'google-service-account.json', 
});
console.log("[API] Speech-to-Text 클라이언트 초기화 완료");

// Vertex AI 클라이언트 초기화 (서비스 계정 기반)
console.log("[API] Vertex AI 클라이언트 초기화 시작");
const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || '',
  location: 'asia-northeast3', // 서울 리전
});
console.log("[API] Vertex AI 클라이언트 초기화 완료");

const model = vertex_ai.getGenerativeModel({
  model: 'gemini-1.5-flash', // 사용자가 지정한 모델명
});
console.log("[API] Gemini 모델('gemini-1.5-flash') 로딩 완료");

const systemPrompt = `
너는 오류를 절대 용납하지 않는, 대한민국 최고의 동물 치과 차트 분석 AI 비서다.
지금부터 내가 제공하는 오디오 파일을 듣고, 다음 두 가지 임무를 순서대로 완벽하게 수행해야 한다.

첫째, 오디오의 한국어 음성을 텍스트로 정확하게 변환한다.
둘째, 변환된 텍스트의 의미를 분석하여, 아래 규칙에 따라 반드시 JSON 객체 형식으로만 결과를 반환한다. 다른 설명은 절대 추가하지 마라.

--- 규칙 및 예시 ---

1.  **치주염 (PD, Periodontitis):**
    *   "104번 치주염 3단계" 또는 "104번 피디 쓰리" → {"toothId": "104", "type": "status", "actionId": "PD", "value": "3"}

2.  **치은염 (GR, Gingivitis):**
    *   "204번 치은염" 또는 "204번 지알 원" → {"toothId": "204", "type": "status", "actionId": "GR", "value": "1"}

3.  **치아 파절 (FX, Fracture):**
    *   "409번 치아 파절" 또는 "409번 에프엑스" → {"toothId": "409", "type": "status", "actionId": "FX"}

4.  **치석 (CAL, Calculus):**
    *   "301번 치석 심함" 또는 "301번 칼 쓰리" → {"toothId": "301", "type": "status", "actionId": "CAL", "value": "3"}

5.  **치주 포켓 (P, Pocket):**
    *   "108번 포켓 3미리" → {"toothId": "108", "type": "status", "actionId": "P", "value": "3"}

6.  **탐침 시 출혈 (BOP, Bleeding on Probing):**
    *   "210번 비오피" → {"toothId": "210", "type": "status", "actionId": "BOP"}

7.  **발치 (EXT, Extraction):**
    *   "304번 발치" 또는 "304번 이엑스티" → {"toothId": "304", "type": "action", "actionId": "EXT"}

8.  **폴리싱 (POL, Polishing):**
    *   "전체 폴리싱" → {"toothId": "all", "type": "action", "actionId": "POL"}

9.  **스케일링 (SC, Scaling):**
    *   "전체 스케일링" → {"toothId": "all", "type": "action", "actionId": "SC"}

10. **메모 (MEMO):**
    *   "오른쪽 위 송곳니 뿌리 끝 문제 있음 메모" → {"type": "memo", "content": "오른쪽 위 송곳니 뿌리 끝 문제 있음"}
    *   "사랑니 주변 잇몸 부음 메모" → {"type": "memo", "content": "사랑니 주변 잇몸 부음"}

--- 중요 ---
*   치아 번호는 101~104, 201~204, ... 401~411 사이의 숫자만 유효하다.
*   '전체'는 "all"으로 표기한다.
*   인식할 수 없는 명령어는 무시하고, 유효한 명령만 JSON 객체 배열로 반환한다.
*   결과는 반드시 JSON 배열 \`[]\` 로 감싸야 한다. 단, 메모(MEMO)는 배열에 포함하지 않고, 별도의 \`memo\` 필드를 가진 단일 JSON 객체로 반환한다.
*   메모와 다른 명령이 함께 있는 경우, \`results\`와 \`memo\` 필드를 모두 포함하는 단일 JSON 객체를 반환한다.
    *   예시: "104번 발치하고 전체 스케일링, 그리고 잇몸 색깔이 이상함 메모" → \`{"results": [{"toothId": "104", "type": "action", "actionId": "EXT"}, {"toothId": "all", "type": "action", "actionId": "SC"}], "memo": "잇몸 색깔이 이상함"}\`
    *   예시: "301번 피디 투" → \`{"results": [{"toothId": "301", "type": "status", "actionId": "PD", "value": "2"}]}\`
    *   예시: "오른쪽 아래 어금니쪽 불편함 메모" → \`{"memo": "오른쪽 아래 어금니쪽 불편함"}\`
*   결과는 항상 완벽한 JSON 형식이어야 하며, 다른 텍스트나 설명은 절대 포함해서는 안 된다.
*   오디오에 음성이 없거나, 유효한 명령어가 하나도 없는 경우, 빈 배열 \`[]\`만 반환한다.
`;

export async function POST(request: NextRequest) {
  console.log("\n--- [API] /api/analyzeAudio POST 요청 수신 ---");
  try {
    // 1. 클라이언트로부터 오디오 파일 받기
    console.log("[API] 1. 오디오 파일 수신 시작");
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error("[API] 1.1. 오류: 폼 데이터에 'file'이 없음");
      return new NextResponse(JSON.stringify({ error: '오디오 파일이 없습니다.' }), { status: 400 });
    }
    console.log(`[API] 1.2. 파일 수신 성공: ${file.name}, size: ${file.size} bytes`);

    const audioBuffer = await file.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    console.log("[API] 1.3. 오디오를 Base64로 인코딩 완료");

    // 2. Google Cloud Speech-to-Text를 이용한 음성-텍스트 변환
    console.log("[API] 2. Google Cloud STT 요청 시작");
    const audio = { content: audioBase64 };
    const recognitionConfig = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      languageCode: 'ko-KR',
      adaptation: {
        phraseSets: [
          {
            phraseSetId: 'dental-chart-vocabulary',
            phrases: [
              { value: '치주염 1단계', boost: 20 }, { value: '치주염 2단계', boost: 20 }, { value: '치주염 3단계', boost: 20 }, { value: '치주염 4단계', boost: 20 },
              { value: '발치', boost: 15 }, { value: '크랙', boost: 15 }, { value: '치은 퇴축', boost: 15 }, { value: '치근단 농양', boost: 15 },
              { value: '스케일링', boost: 10 }, { value: '레진', boost: 10 },
              ...Array.from({ length: 11 }, (_, i) => ({ value: `${101 + i}번`, boost: 5 })),
              ...Array.from({ length: 11 }, (_, i) => ({ value: `${201 + i}번`, boost: 5 })),
              ...Array.from({ length: 12 }, (_, i) => ({ value: `${301 + i}번`, boost: 5 })),
              ...Array.from({ length: 12 }, (_, i) => ({ value: `${401 + i}번`, boost: 5 })),
            ],
          },
        ],
      },
    };
    const sttRequest = { audio: audio, config: recognitionConfig };

    const [sttResponse] = await speechClient.recognize(sttRequest);
    const transcription = sttResponse.results
      ?.map(result => result.alternatives?.[0].transcript)
      .join('\n') || '';
    
    console.log(`[API] 2.1. STT 응답 수신. 변환된 텍스트: "${transcription}"`);

    if (transcription.trim() === '') {
      console.log("[API] 2.2. 변환된 텍스트가 없어 빈 결과 반환");
      return new NextResponse(JSON.stringify({ transcription: '', analysis: { results: [] } }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Vertex AI Gemini를 이용한 텍스트-JSON 변환
    console.log("[API] 3. Gemini(Vertex AI) 텍스트 분석 요청 시작");
    const geminiRequest = {
        contents: [{ role: 'user', parts: [{ text: systemPrompt }, {text: transcription}] }],
    };

    const geminiResult = await model.generateContent(geminiRequest);
    // Vertex AI 응답 구조에 맞게 수정
    const responseText = geminiResult.response.candidates?.[0].content.parts[0].text || '';
    console.log(`[API] 3.1. Gemini 응답 수신. 원본 응답:\n${responseText}`);

    // 4. 최종 결과 반환
    console.log("[API] 4. 최종 응답 파싱 및 전송 시작");
    let parsedJson;
    try {
      const cleanedText = responseText.replace(/```json\n|```/g, '').trim();
      parsedJson = JSON.parse(cleanedText);
      console.log("[API] 4.1. Gemini 응답 JSON 파싱 성공");
    } catch (e) {
      console.error("[API] 4.2. CRITICAL: Gemini 응답 JSON 파싱 오류", e);
      console.error("[API] Gemini 원본 응답:", responseText);
      return new NextResponse(JSON.stringify({ 
        error: "AI 응답을 처리하는 중 오류가 발생했습니다.",
        transcription: transcription,
        rawResponse: responseText 
      }), { status: 500 });
    }

    const finalResponse = {
      transcription: transcription,
      analysis: parsedJson,
    };
    console.log("[API] 4.3. 클라이언트에 최종 응답 전송");
    console.log("--- [API] 요청 처리 완료 ---");

    return new NextResponse(JSON.stringify(finalResponse), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[API] FATAL: /api/analyzeAudio 처리 중 예외 발생', error);
    if (error instanceof Error) {
        console.error(`[API] FATAL Details: ${error.stack}`);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(JSON.stringify({ error: '오디오 분석에 실패했습니다.', details: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
