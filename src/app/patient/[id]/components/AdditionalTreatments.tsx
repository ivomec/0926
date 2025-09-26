'use client';

import * as React from 'react';
import type { Patient, SelectedTreatment, Costs } from '@/lib/types';
import { additionalTreatmentsConfig, type TreatmentCategory } from '@/lib/costs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Syringe, Droplets, HeartPulse, Sparkles, Home, Pill, BadgePlus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormContext } from 'react-hook-form';
import type { PatientFormValues } from './PatientDetailView';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// (중략)

interface AdditionalTreatmentsProps {
  patient: Patient;
  selectedTreatments: SelectedTreatment[];
  onTreatmentsChange: (treatments: SelectedTreatment[]) => void;
  setCosts: React.Dispatch<React.SetStateAction<Costs>>;
}

type TreatmentItem = {
  id: string;
  name: string;
  options: { key: string; label: string; price: number }[];
  isMultiSelect?: boolean;
};

const categoryIcons: { [key in TreatmentCategory['id']]: React.ReactNode } = {
    additionalAnesthesiaDrugs: <BadgePlus className="h-5 w-5" />,
    anesthesia: <Droplets className="h-5 w-5" />,
    pain: <HeartPulse className="h-5 w-5" />,
    recovery: <Sparkles className="h-5 w-5" />,
    homeCare: <Home className="h-5 w-5" />,
};

const AdditionalTreatments: React.FC<AdditionalTreatmentsProps> = ({ patient, selectedTreatments, onTreatmentsChange, setCosts }) => {
  const { watch } = useFormContext<PatientFormValues>();
  const [openSheet, setOpenSheet] = React.useState<TreatmentCategory['id'] | null>(null);
  const [localSelection, setLocalSelection] = React.useState<SelectedTreatment[]>([]);

  const species = watch('species');
  const weight = watch('weight');
  
  const config = React.useMemo(() => {
    if (!species || !weight) return {};
    return additionalTreatmentsConfig({ ...patient, species, weight });
  }, [patient, species, weight]);

  React.useEffect(() => {
    if (openSheet) {
      setLocalSelection(selectedTreatments);
    }
  }, [openSheet, selectedTreatments]);

  React.useEffect(() => {
    const additionalCost = selectedTreatments
      .reduce((sum, item) => sum + (item.price || 0), 0);

    setCosts(prev => ({
      ...prev,
      additional: additionalCost,
    }));
  }, [selectedTreatments, setCosts]);
  
  const handleSheetOpen = (categoryId: TreatmentCategory['id']) => {
    setOpenSheet(categoryId);
  };

  const handleSheetClose = () => {
    setOpenSheet(null);
  };
  
  const handleConfirmSelection = () => {
    onTreatmentsChange(localSelection);
    handleSheetClose();
  };
  
  const handleToggle = (item: TreatmentItem, option: { key: string; label: string; price: number }) => {
    setLocalSelection(prevSelection => {
        const isSelected = prevSelection.some(t => t.id === item.id && t.optionKey === option.key);
        let updatedTreatments;

        if (isSelected) {
            updatedTreatments = prevSelection.filter(t => !(t.id === item.id && t.optionKey === option.key));
        } else {
            const newTreatment: SelectedTreatment = {
                id: item.id,
                optionKey: option.key,
                price: option.price,
                name: `${item.name}${option.label ? `: ${option.label}` : ''}`,
            };
            if (!item.isMultiSelect) {
                updatedTreatments = prevSelection.filter(t => t.id !== item.id);
                updatedTreatments.push(newTreatment);
            } else {
                updatedTreatments = [...prevSelection, newTreatment];
            }
        }
        return updatedTreatments;
    });
};


  const handleOptionChange = (item: TreatmentItem, optionKey: string) => {
    const selectedOption = item.options.find(opt => opt.key === optionKey);
    
    let updatedTreatments = localSelection.filter(t => t.id !== item.id);
    
    if (selectedOption) {
       const newTreatment: SelectedTreatment = {
            id: item.id,
            optionKey: selectedOption.key,
            price: selectedOption.price,
            name: `${item.name}${selectedOption.label ? `: ${selectedOption.label}` : ''}`,
       };
       updatedTreatments.push(newTreatment);
    }

    setLocalSelection(updatedTreatments);
  }

  const renderSelectionSheet = () => {
    if (!openSheet || !config.categories) return null;

    const category = config.categories.find(c => c.id === openSheet);
    const items = config.itemsByCategoryId[openSheet as keyof typeof config.itemsByCategoryId] as TreatmentItem[] | undefined;

    if (!category || !items) return null;

    if (category.id === 'homeCare') {
        const oralMedsItem = items.find(item => item.id === 'oral_meds');
        const liquidAnalgesicItem = items.find(item => item.id === 'liquid_analgesic');
        const capsuleItem = items.find(item => item.id === 'capsule');
        const otherItems = items.filter(item => !['oral_meds', 'liquid_analgesic', 'capsule'].includes(item.id));
        
        const currentOralMeds = localSelection.find(t => t.id === 'oral_meds');
        const currentLiquidAnalgesic = localSelection.find(t => t.id === 'liquid_analgesic');
        const currentCapsule = localSelection.find(t => t.id === 'capsule');

        return (
            <Sheet open={!!openSheet} onOpenChange={(isOpen) => !isOpen && handleSheetClose()}>
                <SheetContent className="w-full sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">{categoryIcons[category.id]} {category.name}</SheetTitle>
                    <SheetDescription>{category.description}</SheetDescription>
                </SheetHeader>
                <Button onClick={handleConfirmSelection} className="my-4 w-full">확인</Button>
                <ScrollArea className="h-[calc(100vh-14rem)] pr-4">
                    <div className="space-y-6">
                    {oralMedsItem && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">{oralMedsItem.name}</h4>
                            <div className="grid grid-cols-4 gap-2">
                                {oralMedsItem.options.map(opt => (
                                <Button key={opt.key} variant={currentOralMeds?.optionKey === opt.key ? 'secondary' : 'outline'} className={cn("text-xs", currentOralMeds?.optionKey === opt.key && "bg-yellow-100 hover:bg-yellow-200 border-yellow-300")} onClick={() => handleOptionChange(oralMedsItem, opt.key)}>{opt.label}</Button>
                                ))}
                                <Button variant={!currentOralMeds ? 'secondary' : 'outline'} className={cn("text-xs col-span-1", !currentOralMeds && "bg-yellow-100 hover:bg-yellow-200 border-yellow-300")} onClick={() => handleOptionChange(oralMedsItem, '')}>선택안함</Button>
                            </div>
                        </div>
                    )}
                    
                    {capsuleItem && (
                         <div className="space-y-2">
                            <h4 className="font-medium text-sm">{capsuleItem.name}</h4>
                            <div className="grid grid-cols-4 gap-2">
                                {capsuleItem.options.map(opt => (
                                <Button key={opt.key} variant={currentCapsule?.optionKey === opt.key ? 'secondary' : 'outline'} className={cn("text-xs", currentCapsule?.optionKey === opt.key && "bg-yellow-100 hover:bg-yellow-200 border-yellow-300")} onClick={() => handleOptionChange(capsuleItem, opt.key)}>{opt.label}</Button>
                                ))}
                                <Button variant={!currentCapsule ? 'secondary' : 'outline'} className={cn("text-xs", !currentCapsule && "bg-yellow-100 hover:bg-yellow-200 border-yellow-300")} onClick={() => handleOptionChange(capsuleItem, '')}>선택안함</Button>
                            </div>
                         </div>
                    )}

                    {liquidAnalgesicItem && (
                         <div className="space-y-2">
                            <h4 className="font-medium text-sm">{liquidAnalgesicItem.name}</h4>
                            <div className="grid grid-cols-4 gap-2">
                                {liquidAnalgesicItem.options.map(opt => (
                                <Button key={opt.key} variant={currentLiquidAnalgesic?.optionKey === opt.key ? 'secondary' : 'outline'} className={cn("h-auto text-xs whitespace-normal", currentLiquidAnalgesic?.optionKey === opt.key && "bg-yellow-100 hover:bg-yellow-200 border-yellow-300")} onClick={() => handleOptionChange(liquidAnalgesicItem, opt.key)}>{opt.label}</Button>
                                ))}
                                <Button variant={!currentLiquidAnalgesic ? 'secondary' : 'outline'} className={cn("text-xs", !currentLiquidAnalgesic && "bg-yellow-100 hover:bg-yellow-200 border-yellow-300")} onClick={() => handleOptionChange(liquidAnalgesicItem, '')}>선택안함</Button>
                            </div>
                         </div>
                    )}

                    {otherItems.map(item => (
                        <div key={item.id} className="space-y-2">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <div className={cn("grid gap-2", item.isMultiSelect ? "grid-cols-1" : "grid-cols-2")}>
                                {item.options.map(opt => {
                                    const isSelected = localSelection.some(t => t.id === item.id && t.optionKey === opt.key);
                                    return (
                                        <Button
                                            key={opt.key}
                                            variant={isSelected ? 'secondary' : 'outline'}
                                            className={cn("w-full justify-between h-auto py-2 text-left", isSelected && "bg-yellow-100 hover:bg-yellow-200 border-yellow-300")}
                                            onClick={() => handleToggle(item, opt)}
                                        >
                                            <span className="text-sm whitespace-normal">{opt.label}</span>
                                            <span className="text-sm font-mono whitespace-nowrap pl-2">(+{opt.price.toLocaleString()}원)</span>
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                <SheetFooter className="mt-4">
                    <Button onClick={handleConfirmSelection} className="w-full">확인</Button>
                </SheetFooter>
                </SheetContent>
            </Sheet>
        );
    }

    return (
      <Sheet open={!!openSheet} onOpenChange={(isOpen) => !isOpen && handleSheetClose()}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">{categoryIcons[category.id]} {category.name}</SheetTitle>
            <SheetDescription>{category.description}</SheetDescription>
          </SheetHeader>
          <Button onClick={handleConfirmSelection} className="my-4 w-full">확인</Button>
          <ScrollArea className="h-[calc(100vh-14rem)] pr-4">
            <div className="space-y-4">
                {items.map(item => (
                    <div key={item.id} className="space-y-2">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <div className={cn("grid gap-2", item.isMultiSelect ? "grid-cols-1" : "grid-cols-2")}>
                            {item.options.map(opt => {
                                const isSelected = localSelection.some(t => t.id === item.id && t.optionKey === opt.key);
                                return (
                                    <Button
                                        key={opt.key}
                                        variant={isSelected ? 'secondary' : 'outline'}
                                        className={cn("w-full justify-between h-auto py-2 text-left", isSelected && "bg-yellow-100 hover:bg-yellow-200 border-yellow-300")}
                                        onClick={() => handleToggle(item, opt)}
                                    >
                                        <span className="text-sm whitespace-normal">{opt.label}</span>
                                        <span className="text-sm font-mono whitespace-nowrap pl-2">(+{opt.price.toLocaleString()}원)</span>
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
          </ScrollArea>
          <SheetFooter className="mt-4">
            <Button onClick={handleConfirmSelection} className="w-full">확인</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  };
  
  if (!config.categories) {
    return (
        <AccordionItem value="item-10">
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">환자 정보 (종, 체중)를 먼저 입력해주세요.</p>
                </CardContent>
            </Card>
        </AccordionItem>
    )
  }

  return (
    <AccordionItem value="item-10">
        <Card>
            <AccordionTrigger className="p-6">
                <CardTitle>
                    <div className="flex items-center gap-2"><Pill />추가 처치 항목</div>
                </CardTitle>
            </AccordionTrigger>
            <AccordionContent className="p-6 pt-0">
                <CardDescription className="mb-4">각 항목을 클릭하여 세부 처치를 선택하세요.</CardDescription>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {(config.categories as TreatmentCategory[]).map(category => {
                        const itemsForCategory = config.itemsByCategoryId[category.id as keyof typeof config.itemsByCategoryId] as TreatmentItem[] | undefined;
                        const selectedInCategory = selectedTreatments.filter(st => 
                        itemsForCategory?.some(item => item.id === st.id)
                        );
                        const isSelected = selectedInCategory.length > 0;

                        return (
                            <Card 
                            key={category.id} 
                            className={cn(
                                "flex flex-col cursor-pointer transition-all",
                                isSelected ? "border-primary shadow-lg" : "hover:shadow-md"
                            )}
                            onClick={() => handleSheetOpen(category.id)}
                            >
                            <div className={cn("flex-grow flex flex-col items-center justify-center p-4 gap-2 rounded-t-lg", isSelected ? "bg-primary/10" : "")}>
                                <div className={cn("flex items-center gap-2 text-lg font-semibold", isSelected ? "text-primary" : "text-card-foreground")}>
                                    {React.cloneElement(categoryIcons[category.id] as React.ReactElement, { className: "h-6 w-6" })}
                                    <span>{category.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    {isSelected ? `${selectedInCategory.length}개 항목 선택됨` : category.description}
                                </p>
                            </div>
                            
                            {isSelected && (
                                <div className="p-3 border-t border-primary/20 bg-primary/5 space-y-1.5">
                                    {selectedInCategory.map(item => (
                                        <div key={item.id + item.optionKey} className="flex items-center justify-between gap-2 text-xs text-primary font-medium">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                                                <p className="truncate">{item.name}</p>
                                            </div>
                                            <span className="font-mono whitespace-nowrap">{item.price > 0 ? `(${item.price.toLocaleString()}원)` : ''}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            </Card>
                        );
                    })}
                    {renderSelectionSheet()}
                </div>
            </AccordionContent>
        </Card>
    </AccordionItem>
  );
};

export default React.memo(AdditionalTreatments);