import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, GitCompare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PartCompareDialog } from "./PartCompareDialog";
import { useToast } from "@/hooks/use-toast";

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

interface PartHistoryDialogProps {
  partId: string | null;
  partName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserClick?: (userId: string) => void;
}

export const PartHistoryDialog = ({ partId, partName, open, onOpenChange, onUserClick }: PartHistoryDialogProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (partId && open) {
      loadHistory();
    }
  }, [partId, open]);

  const loadHistory = async () => {
    if (!partId) return;
    
    setIsLoading(true);
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('parts_history')
        .select('*')
        .eq('part_id', partId)
        .order('changed_at', { ascending: false });
      
      if (historyError) throw historyError;
      
      if (!historyData || historyData.length === 0) {
        setHistory([]);
        return;
      }
      
      // Get unique user IDs
      const userIds = [...new Set(historyData.map(h => h.changed_by).filter(Boolean))];
      
      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map of user ID to full name
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, { full_name: p.full_name }])
      );
      
      // Combine history with profiles
      const enrichedHistory = historyData.map(entry => ({
        ...entry,
        profiles: entry.changed_by ? profilesMap.get(entry.changed_by) || null : null
      }));
      
      setHistory(enrichedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (entryId: string, checked: boolean) => {
    if (checked) {
      if (selectedEntries.length >= 2) {
        toast({
          title: "Maximum 2 verzió",
          description: "Csak 2 verziót választhatsz ki az összehasonlításhoz.",
          variant: "destructive"
        });
        return;
      }
      setSelectedEntries([...selectedEntries, entryId]);
    } else {
      setSelectedEntries(selectedEntries.filter(id => id !== entryId));
    }
  };

  const handleCompare = () => {
    if (selectedEntries.length !== 2) {
      toast({
        title: "Válassz 2 verziót",
        description: "Pontosan 2 verziót kell kiválasztanod az összehasonlításhoz.",
        variant: "destructive"
      });
      return;
    }
    setCompareDialogOpen(true);
  };

  const getSelectedEntries = (): [HistoryEntry, HistoryEntry] | null => {
    if (selectedEntries.length !== 2) return null;
    const entries = selectedEntries.map(id => history.find(h => h.id === id)).filter(Boolean) as HistoryEntry[];
    if (entries.length !== 2) return null;
    return [entries[0], entries[1]];
  };

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">Szerkesztési történet</DialogTitle>
                {partName && (
                  <p className="text-sm text-muted-foreground">{partName}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCompare}
                disabled={selectedEntries.length !== 2}
                className="ml-4"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Összehasonlít ({selectedEntries.length}/2)
              </Button>
            </div>
          </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Betöltés...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nincs szerkesztési előzmény</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative">
                  {index !== history.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />
                  )}
                  <div className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <Checkbox
                          checked={selectedEntries.includes(entry.id)}
                          onCheckedChange={(checked) => handleCheckboxChange(entry.id, checked as boolean)}
                        />
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(entry.status)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.changed_at)}
                          </span>
                        </div>

                        {entry.profiles?.full_name && entry.changed_by && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {index === history.length - 1 ? "Feltöltötte: " : "Módosította: "}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (entry.changed_by) {
                                  onUserClick?.(entry.changed_by);
                                }
                              }}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              {entry.profiles.full_name}
                            </button>
                          </div>
                        )}

                        <Separator />

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Rajzszám: </span>
                            <span className="font-mono">{entry.part_number}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Részleg: </span>
                            <span>{entry.department}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Megnevezés: </span>
                            <span>{entry.name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Anyag: </span>
                            <span>{entry.material || "-"}</span>
                          </div>
                          {entry.manufacturing_type && (
                            <div>
                              <span className="text-muted-foreground">Gyártás típusa: </span>
                              <span>{entry.manufacturing_type}</span>
                            </div>
                          )}
                          {entry.responsible_person && (
                            <div>
                              <span className="text-muted-foreground">Felelős személy: </span>
                              <span>{entry.responsible_person}</span>
                            </div>
                          )}
                          {entry.responsible_company && (
                            <div>
                              <span className="text-muted-foreground">Felelős cég: </span>
                              <span>{entry.responsible_company}</span>
                            </div>
                          )}
                          {entry.approver && (
                            <div>
                              <span className="text-muted-foreground">Jóváhagyó: </span>
                              <span>{entry.approver}</span>
                            </div>
                          )}
                        </div>

                        {entry.description && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Leírás: </span>
                            <p className="mt-1 text-muted-foreground">{entry.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>

    <PartCompareDialog
      entries={getSelectedEntries()}
      open={compareDialogOpen}
      onOpenChange={setCompareDialogOpen}
    />
    </>
  );
};
