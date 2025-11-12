import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Plus, Upload } from "lucide-react";

interface PartFile {
  id: string;
  category: string;
  file_url: string;
  version: string;
  created_at: string;
}

interface Part {
  id: string;
  part_number: string;
  department: string;
  name: string;
  description: string | null;
  manufactured_purchased: "gyartott" | "vasarolt";
  manufacturing_type: string | null;
  material: string | null;
  responsible_person: string | null;
  responsible_company: string | null;
  approver: string | null;
  designer: string | null;
  status: "terv" | "gyartas_alatt" | "kesz" | "jovahagyasra_var" | "elutasitva";
  system: string | null;
  assembly: string | null;
  sub_assembly: string | null;
  quantity: number | null;
  cost_per_part: number | null;
  cost_sum: number | null;
  emissions_per_part: number | null;
  emissions_sum: number | null;
  version: string;
  created_at: string;
  updated_at: string;
}

interface TaskFormProps {
  part?: Part | null;
  onClose: () => void;
}

interface NewFile {
  file: File;
  version: string;
  category: string;
}

export const TaskForm = ({ part, onClose }: TaskFormProps) => {
  const [department, setDepartment] = useState(part?.department || "");
  const [name, setName] = useState(part?.name || "");
  const [description, setDescription] = useState(part?.description || "");
  const [manufacturedPurchased, setManufacturedPurchased] = useState(part?.manufactured_purchased || "gyartott");
  const [manufacturingType, setManufacturingType] = useState(part?.manufacturing_type || "");
  const [material, setMaterial] = useState(part?.material || "");
  const [responsiblePerson, setResponsiblePerson] = useState(part?.responsible_person || "");
  const [responsibleCompany, setResponsibleCompany] = useState(part?.responsible_company || "");
  const [approver, setApprover] = useState(part?.approver || "");
  const [status, setStatus] = useState(part?.status || "terv");
  
  const [existingFiles, setExistingFiles] = useState<PartFile[]>([]);
  const [newFiles, setNewFiles] = useState<NewFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [focusedFileIndex, setFocusedFileIndex] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (part?.id) {
      loadExistingFiles();
    }
  }, [part?.id]);

  const loadExistingFiles = async () => {
    if (!part?.id) return;
    
    setIsLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('part_files')
        .select('*')
        .eq('part_id', part.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExistingFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const getHighestVersion = (category: string): string => {
    const categoryFiles = existingFiles.filter(f => f.category === category);
    if (categoryFiles.length === 0) return "0.0.0";
    
    const versions = categoryFiles.map(f => f.version);
    return versions.sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aNum = aParts[i] || 0;
        const bNum = bParts[i] || 0;
        if (aNum !== bNum) return bNum - aNum;
      }
      return 0;
    })[0];
  };

  const compareVersions = (v1: string, v2: string): number => {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Num = v1Parts[i] || 0;
      const v2Num = v2Parts[i] || 0;
      if (v1Num > v2Num) return 1;
      if (v1Num < v2Num) return -1;
    }
    return 0;
  };

  const getSuggestedVersions = (category: string): string[] => {
    const highestVersion = getHighestVersion(category);
    
    // First file - suggest bugfix, minor, and major initial versions
    if (highestVersion === "0.0.0") {
      return ["0.0.1", "0.1.0", "1.0.0"];
    }
    
    // Subsequent files - suggest next bugfix, minor, and major versions
    const parts = highestVersion.split('.').map(Number);
    const [major, minor, patch] = parts;
    
    return [
      `${major}.${minor}.${patch + 1}`, // bugfix
      `${major}.${minor + 1}.0`,        // minor
      `${major + 1}.0.0`                // major
    ];
  };

  const handleAddFile = (category: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = category === 'cad_model' 
      ? '.step,.stp,.stl,.sldprt,.iges,.igs'
      : '.pdf';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setNewFiles(prev => [...prev, { 
          file, 
          category, 
          version: ''
        }]);
      }
    };
    
    input.click();
  };

  const handleVersionChange = (index: number, newVersion: string) => {
    setNewFiles(prev => {
      const updated = [...prev];
      updated[index].version = newVersion;
      return updated;
    });
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingFile = async (fileId: string, fileUrl: string) => {
    try {
      // Delete from storage
      await supabase.storage
        .from('part-files')
        .remove([fileUrl]);
      
      // Delete from database
      const { error } = await supabase
        .from('part_files')
        .delete()
        .eq('id', fileId);
      
      if (error) throw error;
      
      setExistingFiles(prev => prev.filter(f => f.id !== fileId));
      
      toast({
        title: "Fájl törölve",
        description: "A fájl sikeresen törölve lett."
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Hiba",
        description: "Hiba történt a fájl törlésekor.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!department || !name) {
      toast({
        title: "Hiba",
        description: "A részleg és megnevezés mezők kitöltése kötelező!",
        variant: "destructive"
      });
      return;
    }

    // Validate versions
    for (const newFile of newFiles) {
      if (!newFile.version.trim()) {
        toast({
          title: "Hiányzó verzió",
          description: "Minden fájlhoz meg kell adni a verzió számot!",
          variant: "destructive"
        });
        return;
      }
      
      // Minimum version check (must be greater than 0.0.0, so minimum 0.0.1)
      if (compareVersions(newFile.version, "0.0.0") <= 0) {
        toast({
          title: "Érvénytelen verzió",
          description: "A verzió számnak nagyobbnak kell lennie, mint 0.0.0 (minimum: 0.0.1)",
          variant: "destructive"
        });
        return;
      }
      
      // Check against highest existing version
      const highestVersion = getHighestVersion(newFile.category);
      const suggestedVersions = getSuggestedVersions(newFile.category);
      if (highestVersion !== "0.0.0" && compareVersions(newFile.version, highestVersion) <= 0) {
        toast({
          title: "Érvénytelen verzió",
          description: `A verzió számnak nagyobbnak kell lennie, mint ${highestVersion} (javaslat: ${suggestedVersions[0]})`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nincs bejelentkezett felhasználó");

      const partData = {
        department,
        name,
        description: description || null,
        manufactured_purchased: manufacturedPurchased,
        manufacturing_type: manufacturingType || null,
        material: material || null,
        responsible_person: responsiblePerson || null,
        responsible_company: responsibleCompany || null,
        approver: approver || null,
        status,
      };

      let partId = part?.id;

      if (part) {
        const { error } = await supabase
          .from("parts")
          .update(partData)
          .eq("id", part.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("parts")
          .insert([{
            ...partData,
            part_number: '',
            created_by: user.id
          }])
          .select()
          .single();
        
        if (error) throw error;
        partId = data.id;
      }

      // Upload new files
      for (const newFile of newFiles) {
        const fileName = `${partId}/${newFile.category}/${Date.now()}_${newFile.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('part-files')
          .upload(fileName, newFile.file);
        
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('part_files')
          .insert({
            part_id: partId,
            category: newFile.category,
            file_url: fileName,
            version: newFile.version,
            uploaded_by: user.id
          });
        
        if (dbError) throw dbError;
      }

      toast({
        title: part ? "Sikeres módosítás" : "Sikeres létrehozás",
        description: part 
          ? "Az alkatrész sikeresen frissítve lett."
          : "Az új alkatrész sikeresen létrehozva."
      });

      queryClient.invalidateQueries({ queryKey: ["parts"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Hiba történt",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'cad_model': return 'CAD modell';
      case 'technical_drawing': return 'Műszaki rajz';
      case 'documentation': return 'Dokumentáció';
      default: return category;
    }
  };

  const renderFileSection = (category: string) => {
    const categoryFiles = existingFiles.filter(f => f.category === category);
    const categoryNewFiles = newFiles.filter(f => f.category === category);
    const acceptedFiles = category === 'cad_model' 
      ? '.step,.stp,.stl,.sldprt,.iges,.igs'
      : '.pdf';

    return (
      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">{getCategoryLabel(category)}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddFile(category)}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-1" />
            Fájl hozzáadása
          </Button>
        </div>

        {isLoadingFiles ? (
          <div className="flex items-center gap-2 p-3 border rounded-md bg-background">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Betöltés...</span>
          </div>
        ) : (
          <>
            {categoryFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-2 p-3 border rounded-md bg-background">
                <div className="flex-1">
                  <p className="text-sm font-medium">Verzió: {file.version}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(file.created_at).toLocaleDateString('hu-HU')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteExistingFile(file.id, file.file_url)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {categoryNewFiles.map((newFile, index) => {
              const globalIndex = newFiles.findIndex(f => f === newFile);
              const suggestedVersions = getSuggestedVersions(category);
              return (
                <div key={globalIndex} className="flex items-center gap-2 p-3 border rounded-md bg-primary/5">
                  <Upload className="h-4 w-4 text-primary" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">{newFile.file.name}</p>
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Verzió:</Label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={newFile.version}
                            onChange={(e) => handleVersionChange(globalIndex, e.target.value)}
                            onFocus={() => setFocusedFileIndex(globalIndex)}
                            onBlur={() => setTimeout(() => setFocusedFileIndex(null), 200)}
                            placeholder={suggestedVersions[0]}
                            className="h-7 text-xs w-24"
                            disabled={isSubmitting}
                          />
                          {focusedFileIndex === globalIndex && (
                            <div className="absolute top-full left-0 mt-1 flex gap-1 z-10">
                              {suggestedVersions.map((version, vIdx) => (
                                <button
                                  key={version}
                                  type="button"
                                  onClick={() => {
                                    handleVersionChange(globalIndex, version);
                                    setFocusedFileIndex(null);
                                  }}
                                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 shadow-md whitespace-nowrap"
                                  title={vIdx === 0 ? "Bugfix" : vIdx === 1 ? "Minor" : "Major"}
                                >
                                  {version}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          (min: {suggestedVersions[0]})
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveNewFile(globalIndex)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </>
        )}

        {categoryFiles.length === 0 && categoryNewFiles.length === 0 && !isLoadingFiles && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Még nincs feltöltött fájl
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Részleg *</Label>
          <Select value={department} onValueChange={setDepartment} required>
            <SelectTrigger>
              <SelectValue placeholder="Válassz részleget..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Aero">Aero</SelectItem>
              <SelectItem value="Elektronika">Elektronika</SelectItem>
              <SelectItem value="Futómű">Futómű</SelectItem>
              <SelectItem value="Motor">Motor</SelectItem>
              <SelectItem value="Váz">Váz</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {part && (
          <div className="space-y-2">
            <Label>Rajzszám</Label>
            <Input value={part.part_number} disabled className="bg-muted" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Megnevezés *</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Alkatrész neve" 
            required 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Leírás</Label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="További részletek, megjegyzések..." 
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="manufacturedPurchased">Gyártás/Vásárlás</Label>
          <Select value={manufacturedPurchased} onValueChange={(value) => setManufacturedPurchased(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gyartott">Gyártott</SelectItem>
              <SelectItem value="vasarolt">Vásárolt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturingType">Gyártás típusa</Label>
          <Input 
            id="manufacturingType" 
            value={manufacturingType} 
            onChange={(e) => setManufacturingType(e.target.value)} 
            placeholder="pl. CNC mart, 3D nyomtatás" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="material">Anyag</Label>
        <Input 
          id="material" 
          value={material} 
          onChange={(e) => setMaterial(e.target.value)} 
          placeholder="pl. Alumínium 7075, PLA" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="responsiblePerson">Gyártásért felelős személy</Label>
          <Input 
            id="responsiblePerson" 
            value={responsiblePerson} 
            onChange={(e) => setResponsiblePerson(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleCompany">Gyártásért felelős cég</Label>
          <Input 
            id="responsibleCompany" 
            value={responsibleCompany} 
            onChange={(e) => setResponsibleCompany(e.target.value)} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approver">Gyártást jóváhagyó személy</Label>
        <Input 
          id="approver" 
          value={approver} 
          onChange={(e) => setApprover(e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Státusz</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="terv">Terv</SelectItem>
            <SelectItem value="gyartas_alatt">Gyártás alatt</SelectItem>
            <SelectItem value="kesz">Kész</SelectItem>
            <SelectItem value="jovahagyasra_var">Jóváhagyásra vár</SelectItem>
            <SelectItem value="elutasitva">Elutasítva</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-lg">Fájlok és verziók</h3>
        {renderFileSection('cad_model')}
        {renderFileSection('technical_drawing')}
        {renderFileSection('documentation')}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Mégse
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {part ? "Frissítés" : "Létrehozás"}
        </Button>
      </div>
    </form>
  );
};