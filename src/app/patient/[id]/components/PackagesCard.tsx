
'use client';

import * as React from 'react';
import type { Patient, SelectedTreatment, Costs } from '@/lib/types';
import { packagesConfig } from '@/lib/costs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Package, CheckCircle2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { PatientFormValues } from './PatientDetailView';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PackagesCardProps {
  patient: Patient;
  selectedPackages: SelectedTreatment[];
  onPackagesChange: (packages: SelectedTreatment[]) => void;
  setCosts: React.Dispatch<React.SetStateAction<Costs>>;
}

type PackageItem = {
  id: string;
  name: string;
  category: 'scaling' | 'checkup';
  options: { key: string; label: string; price: number }[];
};

type PackageGroup = 'scaling' | 'checkup';

const PackagesCard: React.FC<PackagesCardProps> = ({ patient, selectedPackages, onPackagesChange, setCosts }) => {
  const { watch } = useFormContext<PatientFormValues>();
  const [openSheet, setOpenSheet] = React.useState<PackageGroup | null>(null);
  
  const species = watch('species');
  const weight = watch('weight');

  const config = React.useMemo(() => {
    if (!species || !weight) return null;
    return packagesConfig({ ...patient, species, weight });
  }, [patient, species, weight]);

  React.useEffect(() => {
    const anesthesiaCost = selectedPackages
      .filter(p => p.category === 'scaling')
      .reduce((sum, pkg) => sum + (pkg.price || 0), 0);
    const checkupCost = selectedPackages
      .filter(p => p.category === 'checkup')
      .reduce((sum, pkg) => sum + (pkg.price || 0), 0);

    setCosts(prev => ({
      ...prev,
      anesthesia: anesthesiaCost,
      checkup: checkupCost,
    }));
  }, [selectedPackages, setCosts]);

  const handleSheetOpen = (group: PackageGroup) => {
    setOpenSheet(group);
  };

  const handleSheetClose = () => {
    setOpenSheet(null);
  };

  const handlePackageToggle = (item: PackageItem, option: { key: string, label: string, price: number }) => {
    const newSelectedPackage: SelectedTreatment = {
      id: item.id,
      optionKey: option.key,
      price: option.price,
      name: option.label,
      category: item.category,
    };

    const isSelected = selectedPackages.some(p => p.id === newSelectedPackage.id && p.optionKey === newSelectedPackage.optionKey);
    
    let updatedPackages;
  
    if (isSelected) {
      // If the clicked package is already selected, deselect it.
      updatedPackages = selectedPackages.filter(p => !(p.category === item.category && p.id === item.id && p.optionKey === option.key));
    } else {
      // If a new package is selected,
      // remove any other package from the same category first.
      const otherCategoryPackages = selectedPackages.filter(p => p.category !== item.category);
      // Then, add the new package.
      updatedPackages = [...otherCategoryPackages, newSelectedPackage];
    }
  
    onPackagesChange(updatedPackages);
    handleSheetClose(); // Automatically close the sheet on selection
  };

  if (!config) {
    return (
      <AccordionItem value="item-9">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">환자 정보 (종, 체중)를 먼저 입력해주세요.</p>
          </CardContent>
        </Card>
      </AccordionItem>
    );
  }

  const renderSelectionSheet = () => {
    if (!openSheet || !config) return null;

    const groupTitle = openSheet === 'scaling' ? '스케일링 & 마취' : '건강검진';
    const packages = openSheet === 'scaling' ? config.itemsByCategoryId.scalingPackages : config.itemsByCategoryId.checkupPackages;

    return (
      <Sheet open={!!openSheet} onOpenChange={(isOpen) => !isOpen && handleSheetClose()}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{groupTitle} 패키지 선택</SheetTitle>
            <SheetDescription>원하는 패키지를 선택하세요. 그룹 내에서 하나만 선택할 수 있습니다.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] pr-4 mt-4">
            <div className="space-y-4">
              {packages.map(item => (
                <div key={item.id} className="space-y-2">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {item.options.map(opt => {
                      const isSelected = selectedPackages.some(p => p.category === item.category && p.optionKey === opt.key);
                      return (
                        <Card
                          key={`${item.id}-${opt.key}`}
                          className={cn(
                            "flex flex-col cursor-pointer transition-all hover:shadow-md",
                            isSelected ? "border-primary shadow-lg" : ""
                          )}
                          onClick={() => handlePackageToggle(item, opt)}
                        >
                          <CardHeader className={cn("flex-grow p-3", isSelected ? "bg-primary/10" : "")}>
                            <CardTitle className={cn("text-sm", isSelected ? "text-primary" : "")}>{opt.label}</CardTitle>
                          </CardHeader>
                          <CardContent className={cn("p-3 border-t", isSelected ? "border-primary/20 bg-primary/5" : "")}>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-base">{(opt.price || 0).toLocaleString()}원</span>
                              {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  };
  
  const renderCategoryCard = (group: PackageGroup) => {
    const title = group === 'scaling' ? '스케일링 & 마취' : '건강검진';
    const selectedInCategory = selectedPackages.filter(p => p.category === group);
    const isSelected = selectedInCategory.length > 0;
    
    return (
        <Card 
            className={cn(
                "flex flex-col cursor-pointer transition-all",
                isSelected ? "border-primary shadow-lg" : "hover:shadow-md"
            )}
            onClick={() => handleSheetOpen(group)}
        >
        <div className={cn("flex-grow flex flex-col items-center justify-center p-4 gap-2 rounded-t-lg", isSelected ? "bg-primary/10" : "")}>
            <div className={cn("flex items-center gap-2 text-lg font-semibold", isSelected ? "text-primary" : "text-card-foreground")}>
                <Package className="h-6 w-6" />
                <span>{title}</span>
            </div>
             <p className="text-xs text-muted-foreground text-center h-4">
                {isSelected ? `${selectedInCategory.length}개 항목 선택됨` : `패키지를 선택하세요.`}
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
  }

  return (
    <AccordionItem value="item-9">
      <Card>
        <AccordionTrigger className="p-6">
          <CardTitle>
            <div className="flex items-center gap-2"><Package />패키지 선택</div>
          </CardTitle>
        </AccordionTrigger>
        <AccordionContent className="p-6 pt-0">
          <CardDescription className="mb-4">
            각 항목을 클릭하여 스케일링, 마취 및 건강검진 패키지를 선택하세요.
          </CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderCategoryCard('scaling')}
            {renderCategoryCard('checkup')}
          </div>
          {renderSelectionSheet()}
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};

export default React.memo(PackagesCard);

