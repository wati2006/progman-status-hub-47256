import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowUpDown, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PartDetailsDialog } from "./PartDetailsDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  created_by: string | null;
}

type SortField = "part_number" | "name" | "department" | "status" | "created_at";
type SortDirection = "asc" | "desc";

interface TaskTableProps {
  parts: Part[];
  onEdit: (part: Part) => void;
}

export const TaskTable = ({ parts, onEdit }: TaskTableProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedParts = [...parts].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === "created_at") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const getStatusBadge = (status: Part["status"]) => {
    const config: Record<Part["status"], { variant: "default" | "secondary" | "destructive"; label: string; className?: string }> = {
      terv: { variant: "secondary", label: "Terv" },
      gyartas_alatt: { variant: "default", label: "Gyártás alatt" },
      kesz: { variant: "default", label: "Kész", className: "bg-green-600 hover:bg-green-700 text-white" },
      jovahagyasra_var: { variant: "default", label: "Jóváhagyásra vár" },
      elutasitva: { variant: "destructive", label: "Elutasítva" }
    };
    const { variant, label, className } = config[status];
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!partToDelete) return;

    try {
      const { error } = await supabase.from("parts").delete().eq("id", partToDelete);
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
    } finally {
      setPartToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("part_number")} className="h-8 px-2">
                  Rajzszám
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="h-8 px-2">
                  Megnevezés
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("department")} className="h-8 px-2">
                  Részleg
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("status")} className="h-8 px-2">
                  Státusz
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("created_at")} className="h-8 px-2">
                  Létrehozva
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Műveletek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nincs megjeleníthető alkatrész
                </TableCell>
              </TableRow>
            ) : (
              sortedParts.map((part) => (
                <TableRow key={part.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPart(part)}>
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
                  <TableCell>{getStatusBadge(part.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(part.created_at)}</div>
                    {part.created_by && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {part.created_by.substring(0, 8)}...
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedPart(part)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(part)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setPartToDelete(part.id)}>
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

      <PartDetailsDialog 
        part={selectedPart} 
        open={!!selectedPart} 
        onOpenChange={(open) => !open && setSelectedPart(null)} 
      />

      <AlertDialog open={!!partToDelete} onOpenChange={(open) => !open && setPartToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törölni szeretnéd?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem vonható vissza. Az alkatrész véglegesen törlődik az adatbázisból.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Törlés</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};