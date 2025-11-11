import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Task {
  id: string;
  modul: string;
  feladat: string;
  leiras: string | null;
  statusz: "terv" | "folyamatban" | "kesz" | "elvetve";
  felelos: string | null;
  workshop_teams: boolean;
}

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
}

export const TaskForm = ({ task, onClose }: TaskFormProps) => {
  const [modul, setModul] = useState(task?.modul || "");
  const [feladat, setFeladat] = useState(task?.feladat || "");
  const [leiras, setLeiras] = useState(task?.leiras || "");
  const [statusz, setStatusz] = useState<"terv" | "folyamatban" | "kesz" | "elvetve">(
    task?.statusz || "terv"
  );
  const [felelos, setFelelos] = useState(task?.felelos || "");
  const [workshopTeams, setWorkshopTeams] = useState(task?.workshop_teams || false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (task) {
      setModul(task.modul);
      setFeladat(task.feladat);
      setLeiras(task.leiras || "");
      setStatusz(task.statusz);
      setFelelos(task.felelos || "");
      setWorkshopTeams(task.workshop_teams);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const taskData = {
      modul,
      feladat,
      leiras: leiras || null,
      statusz,
      felelos: felelos || null,
      workshop_teams: workshopTeams,
    };

    if (task) {
      // Update existing task
      const { error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", task.id);

      if (error) {
        toast({
          title: "Hiba történt",
          description: "A feladat frissítése sikertelen volt.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Feladat frissítve",
          description: "A feladat sikeresen frissítve lett.",
        });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        onClose();
      }
    } else {
      // Create new task
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("tasks").insert([{
        ...taskData,
        created_by: user?.id,
      }]);

      if (error) {
        toast({
          title: "Hiba történt",
          description: "A feladat létrehozása sikertelen volt.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Feladat létrehozva",
          description: "Az új feladat sikeresen létrehozva.",
        });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        onClose();
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="modul">Modul</Label>
        <Input
          id="modul"
          value={modul}
          onChange={(e) => setModul(e.target.value)}
          placeholder="pl. Futómű, Karosszéria"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feladat">Feladat</Label>
        <Input
          id="feladat"
          value={feladat}
          onChange={(e) => setFeladat(e.target.value)}
          placeholder="Feladat rövid megnevezése"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="leiras">Leírás</Label>
        <Textarea
          id="leiras"
          value={leiras}
          onChange={(e) => setLeiras(e.target.value)}
          placeholder="Részletes leírás..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="statusz">Státusz</Label>
        <Select 
          value={statusz} 
          onValueChange={(value) => setStatusz(value as "terv" | "folyamatban" | "kesz" | "elvetve")}
        >
          <SelectTrigger id="statusz">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="terv">Terv</SelectItem>
            <SelectItem value="folyamatban">Folyamatban</SelectItem>
            <SelectItem value="kesz">Kész</SelectItem>
            <SelectItem value="elvetve">Elvetve</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="felelos">Felelős személy</Label>
        <Input
          id="felelos"
          value={felelos}
          onChange={(e) => setFelelos(e.target.value)}
          placeholder="pl. Kiss Márton Péter"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="workshop"
          checked={workshopTeams}
          onCheckedChange={setWorkshopTeams}
        />
        <Label htmlFor="workshop" className="cursor-pointer">
          Workshop tartható róla Teamsen
        </Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Mentés..." : task ? "Frissítés" : "Létrehozás"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Mégse
        </Button>
      </div>
    </form>
  );
};
