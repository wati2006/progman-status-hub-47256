import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, ArrowUpDown, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { PartDetailsDialog } from "./PartDetailsDialog";
import { MemberProfileDialog } from "./MemberProfileDialog";
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
  cad_model_url: string | null;
  technical_drawing_url: string | null;
  documentation_url: string | null;
  profiles: {
    full_name: string | null;
  } | null;
}

type SortField = "part_number" | "name" | "department" | "status" | "created_at" | "updated_at";
type SortDirection = "asc" | "desc";

interface TaskTableProps {
  parts: Part[];
  onEdit: (part: Part) => void;
}

export const TaskTable = ({ parts, onEdit }: TaskTableProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

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

    if (sortField === "created_at" || sortField === "updated_at") {
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
    return <Badge variant={variant} className={`whitespace-nowrap ${className || ''}`}>{label}</Badge>;
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

  const handleCreatorClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsMemberDialogOpen(true);
  };

  const handlePartClickFromMemberDialog = async (partId: string) => {
    try {
      const part = parts.find(p => p.id === partId);
      if (part) {
        setSelectedPart(part);
      }
    } catch (error: any) {
      toast({
        title: "Hiba történt",
        description: error.message || "Nem sikerült betölteni az alkatrészt.",
        variant: "destructive",
      });
    }
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {sortedParts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nincs megjeleníthető alkatrész
              </CardContent>
            </Card>
          ) : (
            sortedParts.map((part) => (
              <Card key={part.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{part.name}</h3>
                      <p className="text-xs text-muted-foreground">{part.part_number}</p>
                    </div>
                    {getStatusBadge(part.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Részleg</p>
                      <p className="font-medium">{part.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Létrehozta</p>
                      {part.profiles?.full_name ? (
                        <button
                          onClick={() => part.created_by && handleCreatorClick(part.created_by)}
                          className="font-medium text-primary hover:underline text-left truncate w-full"
                        >
                          {part.profiles.full_name}
                        </button>
                      ) : (
                        <p className="text-muted-foreground">Ismeretlen</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPart(part)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Részletek
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(part)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Szerkesztés
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPartToDelete(part.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <PartDetailsDialog
          part={selectedPart}
          open={!!selectedPart}
          onOpenChange={(open) => !open && setSelectedPart(null)}
          onCreatorClick={handleCreatorClick}
        />

        <MemberProfileDialog
          userId={selectedUserId}
          open={isMemberDialogOpen}
          onOpenChange={setIsMemberDialogOpen}
          onPartClick={handlePartClickFromMemberDialog}
        />

        <AlertDialog open={!!partToDelete} onOpenChange={() => setPartToDelete(null)}>
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
  }

  // Desktop Table View
  return (
    <>
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("part_number")} className="h-8 px-2">
                  Rajzszám
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[250px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="h-8 px-2">
                  Megnevezés
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[120px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("department")} className="h-8 px-2">
                  Részleg
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[180px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("status")} className="h-8 px-2">
                  Státusz
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[180px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("created_at")} className="h-8 px-2">
                  Létrehozva
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[180px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("updated_at")} className="h-8 px-2">
                  Módosítva
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right w-[140px]">Műveletek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nincs megjeleníthető alkatrész
                </TableCell>
              </TableRow>
            ) : (
              sortedParts.map((part) => (
                <TableRow key={part.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPart(part)}>
                  <TableCell className="font-mono text-sm max-w-[120px] truncate">{part.part_number}</TableCell>
                  <TableCell className="max-w-[250px]">
                    <div>
                      <div className="font-medium truncate">{part.name}</div>
                      {part.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {part.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">{part.department}</TableCell>
                  <TableCell>{getStatusBadge(part.status)}</TableCell>
                  <TableCell className="min-w-[140px]">
                    <div className="text-sm">{formatDate(part.created_at)}</div>
                    {part.profiles?.full_name && (
                      <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {part.profiles.full_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <div className="text-sm">{formatDate(part.updated_at)}</div>
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
        onCreatorClick={handleCreatorClick}
      />

      <MemberProfileDialog
        userId={selectedUserId}
        open={isMemberDialogOpen}
        onOpenChange={setIsMemberDialogOpen}
        onPartClick={handlePartClickFromMemberDialog}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Törlés</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};