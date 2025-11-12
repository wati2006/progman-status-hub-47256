import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, ArrowRight } from "lucide-react";

interface HistoryEntry {
  id: string;
  changed_at: string;
  changed_by: string | null;
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
  status: "terv" | "gyartas_alatt" | "kesz" | "jovahagyasra_var" | "elutasitva";
  version: string;
  profiles: {
    full_name: string | null;
  } | null;
}

interface PartCompareDialogProps {
  entries: [HistoryEntry, HistoryEntry] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PartCompareDialog = ({ entries, open, onOpenChange }: PartCompareDialogProps) => {
  if (!entries) return null;

  const [older, newer] = entries[0].changed_at < entries[1].changed_at ? entries : [entries[1], entries[0]];

  const statusLabels: Record<HistoryEntry["status"], string> = {
    terv: "Terv",
    gyartas_alatt: "Gyártás alatt",
    kesz: "Kész",
    jovahagyasra_var: "Jóváhagyásra vár",
    elutasitva: "Elutasítva"
  };

  const getStatusLabel = (status: HistoryEntry["status"]) => statusLabels[status];

  const getStatusBadge = (status: HistoryEntry["status"]) => {
    const config: Record<HistoryEntry["status"], { variant: "default" | "secondary" | "destructive"; label: string; className?: string }> = {
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

  const CompareField = ({ label, oldValue, newValue }: { label: string; oldValue: string; newValue: string }) => {
    const isDifferent = oldValue !== newValue;
    
    return (
      <div className={`p-3 rounded-lg ${isDifferent ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' : 'bg-muted/30'}`}>
        <p className="text-xs text-muted-foreground mb-2 font-semibold">{label}</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm">{oldValue || "-"}</p>
          </div>
          <ArrowRight className={`h-4 w-4 flex-shrink-0 ${isDifferent ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
          <div className="flex-1">
            <p className="text-sm font-medium">{newValue || "-"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Verziók összehasonlítása</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(older.changed_at)}</span>
            <ArrowRight className="h-4 w-4" />
            <span>{formatDate(newer.changed_at)}</span>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Régebbi verzió</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(older.status)}
                  <span className="text-xs text-muted-foreground">{formatDate(older.changed_at)}</span>
                </div>
                {older.profiles?.full_name && (
                  <p className="text-xs text-muted-foreground">
                    Módosította: {older.profiles.full_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Újabb verzió</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(newer.status)}
                  <span className="text-xs text-muted-foreground">{formatDate(newer.changed_at)}</span>
                </div>
                {newer.profiles?.full_name && (
                  <p className="text-xs text-muted-foreground">
                    Módosította: {newer.profiles.full_name}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <CompareField 
                label="Státusz" 
                oldValue={getStatusLabel(older.status)} 
                newValue={getStatusLabel(newer.status)} 
              />
              
              <CompareField 
                label="Rajzszám" 
                oldValue={older.part_number} 
                newValue={newer.part_number} 
              />
              
              <CompareField 
                label="Részleg" 
                oldValue={older.department} 
                newValue={newer.department} 
              />
              
              <CompareField 
                label="Megnevezés" 
                oldValue={older.name} 
                newValue={newer.name} 
              />
              
              <CompareField 
                label="Gyártás/Vásárlás" 
                oldValue={older.manufactured_purchased === "gyartott" ? "Gyártott" : "Vásárolt"} 
                newValue={newer.manufactured_purchased === "gyartott" ? "Gyártott" : "Vásárolt"} 
              />
              
              <CompareField 
                label="Gyártás típusa" 
                oldValue={older.manufacturing_type || "-"} 
                newValue={newer.manufacturing_type || "-"} 
              />
              
              <CompareField 
                label="Anyag" 
                oldValue={older.material || "-"} 
                newValue={newer.material || "-"} 
              />
              
              <CompareField 
                label="Felelős személy" 
                oldValue={older.responsible_person || "-"} 
                newValue={newer.responsible_person || "-"} 
              />
              
              <CompareField 
                label="Felelős cég" 
                oldValue={older.responsible_company || "-"} 
                newValue={newer.responsible_company || "-"} 
              />
              
              <CompareField 
                label="Jóváhagyó" 
                oldValue={older.approver || "-"} 
                newValue={newer.approver || "-"} 
              />
              
              <div className={`p-3 rounded-lg ${older.description !== newer.description ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' : 'bg-muted/30'}`}>
                <p className="text-xs text-muted-foreground mb-2 font-semibold">Leírás</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-r pr-3">
                    <p className="text-sm whitespace-pre-wrap">{older.description || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium whitespace-pre-wrap">{newer.description || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
