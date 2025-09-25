
'use client';

import { useState, useRef, type MouseEvent, useEffect, useCallback, WheelEvent as ReactWheelEvent } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageRecord } from '@/lib/types';


type ImageViewerProps = {
  imageData: {
    images: ImageRecord[];
    startIndex: number;
  } | null;
  onClose: () => void;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;

export default function ImageViewer({ imageData, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(imageData?.startIndex || 0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);

  const imageRef = useRef<HTMLImageElement>(null);
  const isPanning = useRef(false);
  const isAdjusting = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const images = imageData?.images || [];
  const imageUrl = images[currentIndex]?.imageUrl;

  const resetState = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setBrightness(1);
    setContrast(1);
  }, []);

  useEffect(() => {
    if (imageData) {
      setCurrentIndex(imageData.startIndex);
      resetState();
    }
  }, [imageData, resetState]);
  
  const handleNext = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    resetState();
  }, [images, resetState]);

  const handlePrev = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    resetState();
  }, [images, resetState]);
  
  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom((prevZoom) => {
        const newZoom = prevZoom - e.deltaY * 0.001;
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    });
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.button === 0) { // Left click
      isPanning.current = true;
    } else if (e.button === 2) { // Right click
      isAdjusting.current = true;
    }
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    
    if (isPanning.current) {
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    }
    
    if (isAdjusting.current) {
      setBrightness(prev => Math.max(0.1, prev - dy * 0.01));
      setContrast(prev => Math.max(0.1, prev + dx * 0.01));
    }
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  
  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isPanning.current = false;
    isAdjusting.current = false;
  };
  
  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    resetState();
  };


  return (
    <Dialog open={!!imageData} onOpenChange={(isOpen) => { if (!isOpen) { onClose(); resetState(); }}}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-2 bg-black border-gray-800 flex flex-col">
        <DialogHeader>
           <DialogTitle className="sr-only">이미지 뷰어</DialogTitle>
           <DialogDescription className="sr-only">
             확대된 이미지입니다. 마우스로 이동, 확대/축소, 밝기/대비 조절이 가능합니다.
           </DialogDescription>
        </DialogHeader>
        <div 
          className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { isPanning.current = false; isAdjusting.current = false; }}
          onDoubleClick={handleDoubleClick}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={handleWheel}
        >
          {imageUrl && (
            <div
              className="absolute top-0 left-0 w-full h-full flex items-center justify-center transition-transform duration-100"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              }}
            >
                <Image
                    ref={imageRef}
                    src={imageUrl}
                    alt="이미지 뷰어"
                    fill
                    className="object-contain drop-shadow-lg"
                    style={{
                        filter: `brightness(${brightness}) contrast(${contrast})`,
                    }}
                />
            </div>
          )}
        </div>
        
        {images.length > 1 && (
          <>
            <Button variant="outline" size="icon" onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 z-10">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 z-10">
              <ChevronRight className="h-6 w-6" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}

        <div className="absolute top-4 right-16 flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={resetState} className="bg-background/50 hover:bg-background/80">
                <RefreshCcw className="h-4 w-4" />
                <span className="sr-only">초기화</span>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
