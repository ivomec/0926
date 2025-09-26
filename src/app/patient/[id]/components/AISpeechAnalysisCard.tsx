
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// A mock speech recognition object for environments where it's not available.
const mockSpeechRecognition = {
  start: () => console.log('Speech recognition started (mock)'),
  stop: () => console.log('Speech recognition stopped (mock)'),
  abort: () => console.log('Speech recognition aborted (mock)'),
  onresult: (event: any) => {},
  onerror: (event: any) => {},
  onend: () => {},
};

export function AISpeechAnalysisCard({ onAnalysis, isProcessing }: { onAnalysis: (text: string) => Promise<void>, isProcessing: boolean }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | typeof mockSpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after a single utterance
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      let finalTranscript = '';

      recognition.onstart = () => {
        finalTranscript = transcribedText; // Keep previous text if any
      }

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscribedText(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({
          title: '음성 인식 오류',
          description: `오류가 발생했습니다: ${event.error}`,
          variant: 'destructive',
        });
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    } else {
        console.warn('Speech Recognition not supported in this browser.');
        recognitionRef.current = mockSpeechRecognition;
    }
    
    return () => {
        recognitionRef.current?.abort();
    }
  }, [toast, transcribedText]);

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!recognitionRef.current) {
         toast({ title: '오류', description: '음성 인식을 초기화할 수 없습니다.', variant: 'destructive'});
         return;
      }
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleAnalyze = async () => {
    if (!transcribedText) {
        toast({ title: '분석할 내용이 없습니다.', description: '마이크 버튼을 눌러 음성을 입력해주세요.'});
        return;
    }
    await onAnalysis(transcribedText);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            AI 음성 분석
        </CardTitle>
        <CardDescription>
          마이크 버튼을 누르고 치아 상태나 시술을 말하면 AI가 분석하여 차트에 자동으로 입력합니다. (예: "104번 수술적 발치")
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button 
              onClick={handleToggleRecording} 
              size="icon" 
              className={cn("w-full sm:w-auto h-10 sm:h-10", isRecording && "bg-red-500 hover:bg-red-600 text-white animate-pulse")}
            >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Textarea
                placeholder="버튼을 누르고 말하면 음성이 텍스트로 변환됩니다..."
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                rows={2}
            />
        </div>
        <Button onClick={handleAnalyze} disabled={isProcessing || !transcribedText} className="w-full">
          {isProcessing ? '분석 중...' : '분석하여 차트에 입력'}
        </Button>
      </CardContent>
    </Card>
  );
}
