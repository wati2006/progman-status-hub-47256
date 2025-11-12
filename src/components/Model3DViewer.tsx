import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Html } from "@react-three/drei";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Maximize2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Model3DViewerProps {
  fileUrl: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Model({ url }: { url: string }) {
  try {
    // Support for GLB/GLTF files
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
  } catch (error) {
    console.error("Error loading model:", error);
    return (
      <Html center>
        <div className="text-destructive">
          Nem sikerült betölteni a modellt
        </div>
      </Html>
    );
  }
}

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Modell betöltése...</p>
      </div>
    </Html>
  );
}

export const Model3DViewer = ({ fileUrl, fileName, open, onOpenChange }: Model3DViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const loadModel = async () => {
    if (!fileUrl || signedUrl) return;
    
    setLoading(true);
    try {
      // Extract the path from the full URL
      const urlParts = fileUrl.split('/storage/v1/object/public/part-files/');
      const filePath = urlParts[1] || fileUrl;

      const { data, error } = await supabase.storage
        .from('part-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      
      setSignedUrl(data.signedUrl);
    } catch (error) {
      console.error('Error loading model:', error);
      toast.error("Hiba", {
        description: "Nem sikerült betölteni a 3D modellt"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  // Load model when dialog opens
  if (open && !signedUrl && !loading) {
    loadModel();
  }

  const fileExtension = fileName.toLowerCase().split('.').pop();
  const isSupportedFormat = ['glb', 'gltf'].includes(fileExtension || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>3D Model Preview - {fileName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!signedUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Letöltés
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-muted/30 rounded-lg overflow-hidden">
          {!isSupportedFormat ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  A 3D előnézet csak GLB és GLTF formátumokat támogat.
                </p>
                <p className="text-sm text-muted-foreground">
                  Jelenlegi fájl: .{fileExtension}
                </p>
                <Button onClick={handleDownload} disabled={!signedUrl}>
                  <Download className="h-4 w-4 mr-2" />
                  Fájl letöltése
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Modell betöltése...</p>
              </div>
            </div>
          ) : signedUrl ? (
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
              <Suspense fallback={<Loader />}>
                <Stage environment="city" intensity={0.6}>
                  <Model url={signedUrl} />
                </Stage>
                <OrbitControls makeDefault />
              </Suspense>
            </Canvas>
          ) : null}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Bal egérgombbal forgasd a modellt</p>
          <p>• Görgővel nagyíts/kicsinyíts</p>
          <p>• Jobb egérgombbal mozgasd a kamerát</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
