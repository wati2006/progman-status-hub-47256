import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Package, Factory, FileText } from "lucide-react";

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
  status: "terv" | "gyartas_alatt" | "kesz" | "jovahagyasra_var" | "elutasitva";
  created_at: string;
  created_by: string | null;
  profiles: {
    full_name: string | null;
  } | null;
}

interface PartDetailsDialogProps {
  part: Part | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PartDetailsDialog = ({ part, open, onOpenChange }: PartDetailsDialogProps) => {
  if (!part) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{part.name}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{part.part_number}</span>
            <span>•</span>
            <span>{part.department}</span>
            <span>•</span>
            {getStatusBadge(part.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {part.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Leírás</h3>
              </div>
              <p className="text-sm text-muted-foreground">{part.description}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Gyártás típusa</h3>
              </div>
              <p className="text-sm">
                {part.manufactured_purchased === "gyartott" ? "Gyártott" : "Vásárolt"}
              </p>
              {part.manufacturing_type && (
                <p className="text-sm text-muted-foreground">{part.manufacturing_type}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Anyag</h3>
              <p className="text-sm">{part.material || "-"}</p>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Factory className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Felelősök</h3>
            </div>
            <div className="space-y-2">
              {part.responsible_person && (
                <div>
                  <p className="text-xs text-muted-foreground">Felelős személy</p>
                  <p className="text-sm">{part.responsible_person}</p>
                </div>
              )}
              {part.responsible_company && (
                <div>
                  <p className="text-xs text-muted-foreground">Felelős cég</p>
                  <p className="text-sm">{part.responsible_company}</p>
                </div>
              )}
              {part.approver && (
                <div>
                  <p className="text-xs text-muted-foreground">Jóváhagyó</p>
                  <p className="text-sm">{part.approver}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Létrehozva: {formatDate(part.created_at)}</span>
            </div>
            {part.profiles?.full_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Feltöltő: {part.profiles.full_name}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
