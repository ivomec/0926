import { LoaderCircle } from 'lucide-react';

export function LoadingOverlay({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg font-medium">{text}</p>
    </div>
  );
}
