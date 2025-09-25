
'use client';

import * as React from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { Plus, Maximize, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageRecord } from '@/lib/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';

interface ImageGalleryCardProps {
  patientId: string;
  images: ImageRecord[];
  openImageViewer: (images: ImageRecord[], startIndex: number) => void;
}

type ImageCategory = 'general' | 'pre-surgery' | 'post-surgery';

const ImageGalleryCard: React.FC<ImageGalleryCardProps> = ({ patientId, images, openImageViewer }) => {
  const [localImages, setLocalImages] = React.useState(images);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentUploadCategory, setCurrentUploadCategory] = React.useState<ImageCategory>('general');
  const [imageToDelete, setImageToDelete] = React.useState<ImageRecord | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);

  const { toast } = useToast();

  React.useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    handleUpload(files, currentUploadCategory);
  };

  const triggerFileUpload = (category: ImageCategory) => {
    setCurrentUploadCategory(category);
    fileInputRef.current?.click();
  };

  const handleUpload = (files: FileList | File[], category: ImageCategory) => {
    setIsUploading(true);
    setUploadProgress(0);
    const filesArray = Array.from(files);

    filesArray.forEach(file => {
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9\uAC00-\uD7A3_.-]/g, '_');
      const filePath = `images/${patientId}/${category}/${Date.now()}_${sanitizedFileName}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, (error) => {
        console.error('Upload failed:', error);
        toast({ title: '업로드 실패', description: `${file.name} 업로드 중 오류 발생`, variant: 'destructive' });
        setIsUploading(false);
      }, async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, 'patients', patientId, 'images'), {
          imageUrl: downloadURL,
          storagePath: filePath,
          category: category,
          uploadedAt: serverTimestamp(),
        });
        toast({ title: '성공', description: `${file.name}이(가) 업로드되었습니다.` });
        setIsUploading(false);
      });
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, category: ImageCategory) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files, category);
    }
  };

  const openDeleteConfirmationDialog = (item: ImageRecord) => {
    setImageToDelete(item);
    setDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;

    const originalImages = localImages;
    const newImages = localImages.filter(image => image.id !== imageToDelete.id);
    setLocalImages(newImages);

    try {
      const response = await fetch('/api/deleteFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          fileId: imageToDelete.id,
          storagePath: imageToDelete.storagePath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }

      toast({ title: '성공', description: '파일이 삭제되었습니다.' });
    } catch (error: any) {
      console.error("Error deleting file: ", error);
      setLocalImages(originalImages);
      toast({ title: '오류', description: error.message || '파일 삭제 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
      setDeleteAlertOpen(false);
      setImageToDelete(null);
    }
  };

  const formatTimestamp = (timestamp: Timestamp | null | undefined, formatStr: string = 'yyyy-MM-dd') => {
    if (!timestamp) return '정보 없음';
    return format(timestamp.toDate(), formatStr, { locale: ko });
  };

  const renderImageGallery = (category: ImageCategory) => {
    const filteredImages = localImages.filter(img => img.category === category);
    return (
        <div
          className="mt-4"
          onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag}
          onDrop={(e) => handleDrop(e, category)}
        >
            <div className={cn("relative p-4 border-2 border-dashed rounded-lg transition-colors", dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/20")}>
              {dragActive && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <UploadCloud className="h-12 w-12 text-primary" />
                  <p className="mt-2 text-lg font-medium text-primary">여기에 파일을 드롭하세요</p>
                </div>
              )}
              {filteredImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredImages.map((image, index) => (
                          <div
                            key={image.id}
                            className="relative aspect-square group overflow-hidden rounded-lg shadow-md cursor-pointer"
                            onClick={() => openImageViewer(filteredImages, index)}
                          >
                              <Image
                                  src={image.imageUrl}
                                  alt={`${formatTimestamp(image.uploadedAt as Timestamp, 'yyyy-MM-dd HH:mm')}의 사진`}
                                  fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex flex-col justify-end">
                                  <p className="text-white text-xs font-medium truncate">{formatTimestamp(image.uploadedAt as Timestamp, 'yyyy-MM-dd HH:mm')}</p>
                              </div>
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Maximize className="text-white h-8 w-8" />
                              </div>
                              <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); openDeleteConfirmationDialog(image);}}>
                                  <Trash2 className="h-3 w-3" />
                              </Button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-8">
                      <p className="text-muted-foreground">업로드된 사진이 없습니다. 파일을 드래그하거나 버튼을 클릭하세요.</p>
                  </div>
              )}
            </div>
            <Button className="mt-4" type="button" onClick={() => triggerFileUpload(category)} disabled={isUploading}>
                <Plus className="mr-2 h-4 w-4" /> 사진 추가
            </Button>
            {isUploading && <Progress value={uploadProgress} className="mt-2" />}
        </div>
    );
  };

  return (
    <>
      <AccordionItem value="item-5">
        <Card>
          <AccordionTrigger className="p-6">
            <CardTitle>사진 및 X-Ray 기록</CardTitle>
          </AccordionTrigger>
          <AccordionContent className="p-6 pt-0">
            <CardDescription>일반 사진, 수술 전/후 X-Ray를 관리합니다.</CardDescription>
            <Tabs defaultValue="general" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">일반 사진</TabsTrigger>
                <TabsTrigger value="pre-surgery">수술 전 X-Ray</TabsTrigger>
                <TabsTrigger value="post-surgery">수술 후 X-Ray</TabsTrigger>
              </TabsList>
              <TabsContent value="general">{renderImageGallery('general')}</TabsContent>
              <TabsContent value="pre-surgery">{renderImageGallery('pre-surgery')}</TabsContent>
              <TabsContent value="post-surgery">{renderImageGallery('post-surgery')}</TabsContent>
            </Tabs>
          </AccordionContent>
        </Card>
      </AccordionItem>

      <input
        type="file" ref={fileInputRef} onChange={handleFileSelect}
        className="hidden" accept="image/*" disabled={isUploading} multiple
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>파일을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다. 선택한 파일이 영구적으로 삭제됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default React.memo(ImageGalleryCard);
