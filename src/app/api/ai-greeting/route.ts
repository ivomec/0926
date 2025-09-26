
import { NextResponse } from 'next/server';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs'; // 이 API를 Node.js 런타임에서 실행하도록 설정

const getKoreanDayOfWeek = (date: Date): string => {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return days[date.getDay()];
};

export async function POST() {
  const openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error("Gemini API key is not defined in environment variables.");
    return NextResponse.json({ message: '서버 설정 오류: Gemini API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  let weatherInfo = '현재 날씨 정보는 알 수 없지만';
  if (openWeatherApiKey) {
    try {
      const lat = 35.1595; 
      const lon = 126.8526; 
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric&lang=kr`
      );
      const weatherData = weatherResponse.data;
      const weatherDescription = weatherData.weather[0]?.description || '정보 없음';
      const temperature = weatherData.main?.temp;
      weatherInfo = `광주의 날씨는 ${weatherDescription}, 온도는 ${temperature}°C`;
    } catch (error) {
      console.error("날씨 정보를 가져오는 데 실패했습니다."); // 날씨 오류는 콘솔에만 기록
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const now = new Date();
    const currentDate = now.toLocaleDateString('ko-KR');
    const currentTime = now.toLocaleTimeString('ko-KR');
    const dayOfWeek = getKoreanDayOfWeek(now);

    const prompt = `
      너의 이름은 반려동물을 사랑하는 AI 비서 '금호AI'야. 
      지금은 ${currentDate} ${currentTime}, ${dayOfWeek}이고, ${weatherInfo}야. 
      이 정보를 바탕으로, 동물병원 원장님께 반갑게 인사하며 오늘 진료도 응원하는 창의적이고 따뜻한 인사말을 딱 한 문장으로 생성해줘.
      이 문장은 음성으로 변환될 예정이야. 듣기 편안하도록, 쉼표(,)를 활용해 자연스럽게 쉬어가는 부분을 꼭 포함해줘.
      특히 '원장님' 다음에는 잠시 쉬는 느낌을 주는 것이 아주 중요해. 예를 들면, "안녕하세요, 원장님. 오늘도 힘찬 하루 보내세요!" 처럼 말이야.
      매번 다른 느낌으로 말해줘.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const greeting = response.text();
    
    return NextResponse.json({ message: greeting.trim() });

  } catch (error) {
    console.error('AI 인사말 생성 중 상세 오류:', error);

    const keySnippet = geminiApiKey 
        ? `시작: ${geminiApiKey.substring(0, 4)}... 끝: ${geminiApiKey.slice(-4)}`
        : '키가 없음';

    if (error instanceof Error) {
        const detailedMessage = `${error.message}. 서버가 읽은 키 정보: ${keySnippet}`;
        return NextResponse.json({ message: `AI 인사말 생성 중 오류가 발생했습니다: ${detailedMessage}` }, { status: 500 });
    }
    return NextResponse.json({ message: `AI 인사말 생성 중 알 수 없는 종류의 오류가 발생했습니다. 서버가 읽은 키 정보: ${keySnippet}` }, { status: 500 });
  }
}
