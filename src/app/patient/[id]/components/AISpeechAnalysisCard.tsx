'use client';

import { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

console.log("[CARD] AISpeechAnalysisCard 컴포넌트 로딩됨");

interface AISpeechAnalysisCardProps {
  onAnalysis: (data: any) => Promise<void>;
  isProcessing: boolean;
}

// A simple utility to play a tone
const playTone = (frequency: number, duration: number) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (!audioContext) {
    console.warn("[CARD] Web Audio API가 지원되지 않습니다.");
    return;
  }
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.connect(audioContext.destination);
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
    audioContext.close();
  }, duration);
};

export const AISpeechAnalysisCard = forwardRef<HTMLButtonElement, AISpeechAnalysisCardProps>(({ onAnalysis, isProcessing }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = useCallback(() => {
    console.log("[CARD] 1. 녹음 시작 요청");
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log("[CARD] 1.1. 마이크 접근 권한 획득 성공");
        playTone(880, 100); // Start tone
        setIsRecording(true);
        setTranscribedText('');
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          console.log("[CARD] 1.2. 오디오 데이터 수신 중...");
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          console.log("[CARD] 1.3. 녹음 중지됨. 오디오 Blob 생성");
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        console.log("[CARD] 1.4. MediaRecorder 시작됨");
      })
      .catch(err => {
        console.error("[CARD] CRITICAL: 마이크 접근 오류:", err);
        if (err.name === 'NotAllowedError') {
          toast({ 
            title: '마이크 권한 오류', 
            description: '마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크 접근을 허용해주세요.',
            variant: 'destructive'
          });
        } else {
          toast({ 
            title: '오류', 
            description: `마이크를 시작할 수 없습니다: ${err.message}`,
            variant: 'destructive'
          });
        }
      });
  }, [toast]);

  const handleStopRecording = useCallback(() => {
    console.log("[CARD] 2. 녹음 중지 요청");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      playTone(440, 100); // Stop tone
      setIsRecording(false);
      console.log("[CARD] 2.1. MediaRecorder 중지됨");
    }
  }, []);

  const handleToggleRecording = useCallback(() => {
    console.log("[CARD] 녹음 토글 버튼 클릭");
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  }, [isRecording, handleStartRecording, handleStopRecording]);

  const handleAnalyzeAudio = useCallback(async () => {
    if (!audioBlob) {
      console.log("[CARD] 3. 분석 시작 - 오디오 Blob 없음, 중단");
      return;
    }
    console.log(`[CARD] 3. 음성 분석 시작. 오디오 크기: ${audioBlob.size} bytes`);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      console.log("[CARD] 3.1. API 서버로 FormData 전송 시작");

      const response = await fetch('/api/analyzeAudio', {
        method: 'POST',
        body: formData,
      });
      console.log(`[CARD] 3.2. API 응답 수신. 상태 코드: ${response.status}`);

      const result = await response.json();

      if (!response.ok) {
        console.error("[CARD] CRITICAL: API 응답 오류", result);
        throw new Error(result.error || '오디오 분석 중 오류가 발생했습니다.');
      }
      
      console.log("[CARD] 3.3. API 응답 JSON 파싱 성공:", result);
      const { transcription, analysis } = result;

      setTranscribedText(transcription || '(인식된 음성이 없습니다.)');
      console.log(`[CARD] 3.4. 상태 업데이트: transcribedText="${transcription}"`);

      if (analysis) {
        console.log("[CARD] 3.5. onAnalysis 콜백 호출");
        await onAnalysis(analysis);
        console.log("[CARD] 3.6. onAnalysis 콜백 실행 완료");
      }
      
      toast({
        title: '분석 완료',
        description: transcription ? '음성 기록을 차트에 반영했습니다.' : '인식된 음성이 없어 차트에 반영할 내용이 없습니다.',
      });

    } catch (error: any) {
      console.error("[CARD] FATAL: 음성 분석 프로세스 중 예외 발생:", error);
      toast({ title: '음성 분석 실패', description: error.message, variant: 'destructive' });
      setTranscribedText('');
    } finally {
      console.log("[CARD] 4. 분석 프로세스 종료");
      setIsAnalyzing(false);
      setAudioBlob(null); 
    }
  }, [audioBlob, toast, onAnalysis]);

  useEffect(() => {
    // audioBlob 상태가 변경되면 분석 함수를 호출합니다.
    if (audioBlob) {
      console.log("[EFFECT] audioBlob 변경 감지, 분석 시작");
      handleAnalyzeAudio();
    }
  }, [audioBlob, handleAnalyzeAudio]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic /> AI 음성 기록
        </CardTitle>
        <CardDescription>
          버튼을 누르고 환자의 상태 또는 처치 내용을 말하면 AI가 분석하여 자동으로 차트에 기록합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button 
            ref={ref} 
            type="button" 
            onClick={handleToggleRecording} 
            className={cn(
              "w-full sm:w-auto text-lg p-6",
              isRecording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
              "text-white transition-all duration-300 ease-in-out transform hover:scale-105"
            )}
            disabled={isAnalyzing || isProcessing}
          >
            {isRecording ? (
              <><MicOff className="mr-2 h-6 w-6 animate-pulse" /> 녹음중</>
            ) : (
              <><Mic className="mr-2 h-6 w-6" /> 음성 기록 시작</>
            )}
          </Button>
          
          {(isAnalyzing || isProcessing) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>{isAnalyzing ? '음성을 분석하는 중...' : '차트 정보를 업데이트하는 중...'}</p>
            </div>
          )}
        </div>

        {transcribedText && (
          <div className="space-y-2 pt-4">
              <h3 className="font-semibold">음성인식 결과</h3>
              <Textarea value={transcribedText} readOnly rows={2} className="bg-secondary leading-relaxed" />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AISpeechAnalysisCard.displayName = 'AISpeechAnalysisCard';
