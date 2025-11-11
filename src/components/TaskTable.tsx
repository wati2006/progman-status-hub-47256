import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

interface TaskTableProps {
  parts: Part[];
  onEdit: (part: Part) => void;
}

export const TaskTable = ({ parts, onEdit }: TaskTableProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getStatusBadge = (status: Part["status"]) => {
    const variants = {
      terv: "secondary",
      gyartas_alatt: "default",
      kesz: "outline",
      jovahagyasra_var: "default",
      elutasitva: "destructive"
    };
    const labels = {
      terv: "Terv",
      gyartas_alatt: "Gyártás alatt",
      kesz: "Kész",
      jovahagyasra_var: "Jóváhagyásra vár",
      elutasitva: "Elutasítva"
    };
    return <Badge variant={variants[status] as any}>{labels[status]}</Badge>;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt az alkatrészt?")) return;

    try {
      const { error } = await supabase.from("parts").delete().eq("id", id);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["parts"] });
      toast({
        title: "Törölve",
        description: "Az alkatrész sikeresen törölve lett."
      });
    } catch (error: any) {
      toast({
        title: "Hiba történt",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rajzszám</TableHead>
            <TableHead>Megnevezés</TableHead>
            <TableHead>Részleg</TableHead>
            <TableHead>Anyag</TableHead>
            <TableHead>Státusz</TableHead>
            <TableHead className="text-right">Mennyiség</TableHead>
            <TableHead className="text-right">Költség</TableHead>
            <TableHead className="text-right">Műveletek</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Nincs megjeleníthető alkatrész
              </TableCell>
            </TableRow>
          ) : (
            parts.map((part) => (
              <TableRow key={part.id}>
                <TableCell className="font-mono text-sm">{part.part_number}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{part.name}</div>
                    {part.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-md">
                        {part.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{part.department}</TableCell>
                <TableCell>{part.material || "-"}</TableCell>
                <TableCell>{getStatusBadge(part.status)}</TableCell>
                <TableCell className="text-right">{part.quantity || 1}</TableCell>
                <TableCell className="text-right">
                  {part.cost_sum ? `€${part.cost_sum.toFixed(2)}` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(part)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(part.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};