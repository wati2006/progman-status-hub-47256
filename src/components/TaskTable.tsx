import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
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
  created_at: string;
  updated_at: string;
}

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

const statusColors: Record<string, string> = {
  terv: "bg-muted text-muted-foreground",
  folyamatban: "bg-info text-info-foreground",
  kesz: "bg-success text-success-foreground",
  elvetve: "bg-destructive text-destructive-foreground",
};

const statusLabels: Record<string, string> = {
  terv: "Terv",
  folyamatban: "Folyamatban",
  kesz: "Kész",
  elvetve: "Elvetve",
};

export const TaskTable = ({ tasks, onEdit }: TaskTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      toast({
        title: "Hiba történt",
        description: "A feladat törlése sikertelen volt.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Feladat törölve",
        description: "A feladat sikeresen törölve lett.",
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
    setDeletingId(null);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Modul</TableHead>
            <TableHead className="font-semibold">Feladat</TableHead>
            <TableHead className="font-semibold">Leírás</TableHead>
            <TableHead className="font-semibold">Státusz</TableHead>
            <TableHead className="font-semibold">Felelős</TableHead>
            <TableHead className="font-semibold text-center">Workshop</TableHead>
            <TableHead className="font-semibold text-right">Műveletek</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Még nincs feladat hozzáadva. Kattints a "Új feladat" gombra a kezdéshez.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{task.modul}</TableCell>
                <TableCell>{task.feladat}</TableCell>
                <TableCell className="max-w-xs truncate">{task.leiras}</TableCell>
                <TableCell>
                  <Badge className={statusColors[task.statusz]}>
                    {statusLabels[task.statusz]}
                  </Badge>
                </TableCell>
                <TableCell>{task.felelos || "-"}</TableCell>
                <TableCell className="text-center">
                  {task.workshop_teams ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      IGEN
                    </Badge>
                  ) : (
                    <Badge variant="outline">NEM</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(task)}
                      title="Szerkesztés"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(task.id)}
                      disabled={deletingId === task.id}
                      title="Törlés"
                    >
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
