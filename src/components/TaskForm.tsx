import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";


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
  cad_model_url: string | null;
  technical_drawing_url: string | null;
  documentation_url: string | null;
}

interface TaskFormProps {
  part?: Part | null;
  onClose: () => void;
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
  const [cadModel, setCadModel] = useState<File | null>(null);
  const [technicalDrawing, setTechnicalDrawing] = useState<File | null>(null);
  const [documentation, setDocumentation] = useState<File | null>(null);
  const [cadModelUrl, setCadModelUrl] = useState(part?.cad_model_url || null);
  const [technicalDrawingUrl, setTechnicalDrawingUrl] = useState(part?.technical_drawing_url || null);
  const [documentationUrl, setDocumentationUrl] = useState(part?.documentation_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteFile = async (fileUrl: string) => {
    try {
      const { error } = await supabase.storage
        .from('part-files')
        .remove([fileUrl]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDeleteCadModel = async () => {
    if (cadModelUrl) {
      await deleteFile(cadModelUrl);
      setCadModelUrl(null);
      
      // Update database
      if (part) {
        await supabase
          .from("parts")
          .update({ cad_model_url: null })
          .eq("id", part.id);
      }
      
      toast({
        title: "Fájl törölve",
        description: "A CAD modell sikeresen törölve lett."
      });
    }
  };

  const handleDeleteTechnicalDrawing = async () => {
    if (technicalDrawingUrl) {
      await deleteFile(technicalDrawingUrl);
      setTechnicalDrawingUrl(null);
      
      // Update database
      if (part) {
        await supabase
          .from("parts")
          .update({ technical_drawing_url: null })
          .eq("id", part.id);
      }
      
      toast({
        title: "Fájl törölve",
        description: "A műszaki rajz sikeresen törölve lett."
      });
    }
  };

  const handleDeleteDocumentation = async () => {
    if (documentationUrl) {
      await deleteFile(documentationUrl);
      setDocumentationUrl(null);
      
      // Update database
      if (part) {
        await supabase
          .from("parts")
          .update({ documentation_url: null })
          .eq("id", part.id);
      }
      
      toast({
        title: "Fájl törölve",
        description: "A dokumentáció sikeresen törölve lett."
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

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nincs bejelentkezett felhasználó");

      let finalCadModelUrl = cadModelUrl;
      let finalTechnicalDrawingUrl = technicalDrawingUrl;
      let finalDocumentationUrl = documentationUrl;

      // Upload CAD model - delete old one if exists
      if (cadModel) {
        if (cadModelUrl) {
          await deleteFile(cadModelUrl);
        }
        const fileName = `${Date.now()}_${cadModel.name}`;
        const { error: uploadError } = await supabase.storage
          .from('part-files')
          .upload(fileName, cadModel);
        
        if (uploadError) throw uploadError;
        finalCadModelUrl = fileName;
      }

      // Upload technical drawing - delete old one if exists
      if (technicalDrawing) {
        if (technicalDrawingUrl) {
          await deleteFile(technicalDrawingUrl);
        }
        const fileName = `${Date.now()}_${technicalDrawing.name}`;
        const { error: uploadError } = await supabase.storage
          .from('part-files')
          .upload(fileName, technicalDrawing);
        
        if (uploadError) throw uploadError;
        finalTechnicalDrawingUrl = fileName;
      }

      // Upload documentation - delete old one if exists
      if (documentation) {
        if (documentationUrl) {
          await deleteFile(documentationUrl);
        }
        const fileName = `${Date.now()}_${documentation.name}`;
        const { error: uploadError } = await supabase.storage
          .from('part-files')
          .upload(fileName, documentation);
        
        if (uploadError) throw uploadError;
        finalDocumentationUrl = fileName;
      }

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
        cad_model_url: finalCadModelUrl,
        technical_drawing_url: finalTechnicalDrawingUrl,
        documentation_url: finalDocumentationUrl,
      };

      if (part) {
        const { error } = await supabase
          .from("parts")
          .update(partData)
          .eq("id", part.id);
        
        if (error) throw error;
        
        toast({
          title: "Sikeres módosítás",
          description: "Az alkatrész sikeresen frissítve lett."
        });
      } else {
        const { error } = await supabase
          .from("parts")
          .insert([{
            ...partData,
            part_number: '',
            created_by: user.id
          }]);
        
        if (error) throw error;
        
        toast({
          title: "Sikeres létrehozás",
          description: "Az új alkatrész sikeresen létrehozva."
        });
      }

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
        <h3 className="font-semibold">Fájlok</h3>
        
        <div className="space-y-2">
          <Label htmlFor="cad-model">CAD modell (STEP, STL, SLDPRT, stb.)</Label>
          {cadModelUrl ? (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
              <span className="text-sm flex-1 font-medium">Fájl feltöltve</span>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={handleDeleteCadModel}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input 
              id="cad-model"
              type="file"
              accept=".step,.stp,.stl,.sldprt,.iges,.igs"
              onChange={(e) => setCadModel(e.target.files?.[0] || null)}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="technical-drawing">Műszaki rajz (PDF)</Label>
          {technicalDrawingUrl ? (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
              <span className="text-sm flex-1 font-medium">Fájl feltöltve</span>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={handleDeleteTechnicalDrawing}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input 
              id="technical-drawing"
              type="file"
              accept=".pdf"
              onChange={(e) => setTechnicalDrawing(e.target.files?.[0] || null)}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentation">Dokumentáció (PDF)</Label>
          {documentationUrl ? (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
              <span className="text-sm flex-1 font-medium">Fájl feltöltve</span>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={handleDeleteDocumentation}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input 
              id="documentation"
              type="file"
              accept=".pdf"
              onChange={(e) => setDocumentation(e.target.files?.[0] || null)}
            />
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Mégse
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Mentés..." : part ? "Módosítás" : "Létrehozás"}
        </Button>
      </div>
    </form>
  );
};