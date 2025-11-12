import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, User, Package, Factory, FileText, Download, FileIcon, History, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PartHistoryDialog } from "./PartHistoryDialog";
import { Model3DViewer } from "./Model3DViewer";

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
  status: "terv" | "gyartas_alatt" | "kesz" | "jovahagyasra_var" | "elutasitva";
  created_at: string;
  updated_at: string;
  created_by: string | null;
  profiles: {
    full_name: string | null;
  } | null;
}

interface PartDetailsDialogProps {
  part: Part | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatorClick?: (userId: string) => void;
}

export const PartDetailsDialog = ({ part, open, onOpenChange, onCreatorClick }: PartDetailsDialogProps) => {
  const [files, setFiles] = useState<PartFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (part?.id && open) {
      loadFiles();
    }
  }, [part?.id, open]);

  const loadFiles = async () => {
    if (!part?.id) return;
    
    setIsLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('part_files')
        .select('*')
        .eq('part_id', part.id)
        .order('version', { ascending: false });
      
      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

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

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('part-files')
        .download(fileUrl);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getCategoryLabel = (category: string, count: number = 0) => {
    if (count === 1) {
      switch (category) {
        case 'cad_model': return 'CAD modell';
        case 'technical_drawing': return 'Műszaki rajz';
        case 'documentation': return 'Dokumentáció';
        default: return category;
      }
    }
    switch (category) {
      case 'cad_model': return 'CAD modellek';
      case 'technical_drawing': return 'Műszaki rajzok';
      case 'documentation': return 'Dokumentációk';
      default: return category;
    }
  };

  const handlePreview = (fileUrl: string, category: string, version: string) => {
    const fileName = `${getCategoryLabel(category, 1)}_v${version}`;
    setSelectedFile({ url: fileUrl, name: fileName });
    setViewerOpen(true);
  };

  const canPreview = (category: string, fileUrl: string) => {
    if (category !== 'cad_model') return false;
    const extension = fileUrl.toLowerCase().split('.').pop();
    return ['glb', 'gltf', 'step', 'stp'].includes(extension || '');
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


  const groupFilesByCategory = () => {
    const grouped: Record<string, PartFile[]> = {
      cad_model: [],
      technical_drawing: [],
      documentation: []
    };
    
    files.forEach(file => {
      if (grouped[file.category]) {
        grouped[file.category].push(file);
      }
    });
    
    return grouped;
  };

  const filesByCategory = groupFilesByCategory();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{part.name}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono">{part.part_number}</span>
                  <span>•</span>
                  <span>{part.department}</span>
                  <span>•</span>
                  {getStatusBadge(part.status)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(true)}
                className="ml-4 mr-8"
              >
                <History className="h-4 w-4 mr-2" />
                Történet
              </Button>
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

          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Fájlok és verziók</h3>
            </div>
            
            {isLoadingFiles ? (
              <p className="text-sm text-muted-foreground">Betöltés...</p>
            ) : files.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nincsenek feltöltött fájlok</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(filesByCategory).map(([category, categoryFiles]) => {
                  if (categoryFiles.length === 0) return null;
                  
                  // Single file - show without accordion
                  if (categoryFiles.length === 1) {
                    const file = categoryFiles[0];
                    
                    return (
                      <div key={category} className="border rounded-lg p-3">
                        <h4 className="text-sm font-semibold mb-2">{getCategoryLabel(category, 1)}</h4>
                        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Verzió: {file.version}</p>
                            <p className="text-xs text-muted-foreground">
                              Feltöltve: {formatDate(file.created_at)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {canPreview(category, file.file_url) && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePreview(file.file_url, category, file.version)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => downloadFile(file.file_url, `${category}_v${file.version}`)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Multiple files - show with accordion
                  return (
                    <Accordion key={category} type="single" collapsible className="w-full border rounded-lg">
                      <AccordionItem value={category} className="border-none">
                        <AccordionTrigger className="text-sm font-semibold px-3">
                          {getCategoryLabel(category, categoryFiles.length)} ({categoryFiles.length})
                        </AccordionTrigger>
                        <AccordionContent className="px-3">
                          <div className="space-y-2">
                            {categoryFiles.map((file) => (
                              <div 
                                key={file.id} 
                                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">Verzió: {file.version}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Feltöltve: {formatDate(file.created_at)}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {canPreview(category, file.file_url) && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handlePreview(file.file_url, category, file.version)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => downloadFile(file.file_url, `${category}_v${file.version}`)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Létrehozva: {formatDate(part.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Legutóbb szerkesztve: {formatDate(part.updated_at)}</span>
            </div>
            {part.profiles?.full_name && part.created_by && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Feltöltő: </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (part.created_by) {
                      onCreatorClick?.(part.created_by);
                    }
                  }}
                  className="text-primary hover:underline cursor-pointer"
                >
                  {part.profiles.full_name}
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    <PartHistoryDialog
      partId={part.id}
      partName={part.name}
      open={isHistoryOpen}
      onOpenChange={setIsHistoryOpen}
      onUserClick={onCreatorClick}
    />
    
    {selectedFile && (
      <Model3DViewer
        fileUrl={selectedFile.url}
        fileName={selectedFile.name}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    )}
  </>
  );
};