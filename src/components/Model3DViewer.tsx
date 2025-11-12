import { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, Html } from "@react-three/drei";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import occtimportjs from "occt-import-js";
import * as THREE from "three";

interface Model3DViewerProps {
  fileUrl: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Model({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStepFile = async () => {
      try {
        const occt = await occtimportjs();
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const fileBuffer = new Uint8Array(buffer);

        const result = occt.ReadStepFile(fileBuffer, null);
        
        if (!result.success) {
          throw new Error("Failed to parse STEP file");
        }

        const group = new THREE.Group();
        
        result.meshes.forEach((mesh: any) => {
          const geometry = new THREE.BufferGeometry();
          
          const vertices = new Float32Array(mesh.attributes.position.array);
          geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
          
          if (mesh.attributes.normal) {
            const normals = new Float32Array(mesh.attributes.normal.array);
            geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
          }
          
          if (mesh.index) {
            const indices = new Uint32Array(mesh.index.array);
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));
          }
          
          const material = new THREE.MeshStandardMaterial({
            color: mesh.color || 0x808080,
            metalness: 0.3,
            roughness: 0.7,
          });
          
          const meshObj = new THREE.Mesh(geometry, material);
          group.add(meshObj);
        });

        setGeometry(group);
      } catch (err) {
        console.error("Error loading STEP file:", err);
        setError("Nem sikerült betölteni a STEP modellt");
      }
    };

    loadStepFile();
  }, [url]);

  if (error) {
    return (
      <Html center>
        <div className="text-destructive">{error}</div>
      </Html>
    );
  }

  if (!geometry) {
    return <Loader />;
  }

  return <primitive object={geometry} />;
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

  // Extract file extension from the actual file URL, not the display name
  const urlParts = fileUrl.split('/');
  const actualFileName = urlParts[urlParts.length - 1];
  const fileExtension = actualFileName.toLowerCase().split('.').pop();
  const isSupportedFormat = ['step', 'stp'].includes(fileExtension || '');

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
                  A 3D előnézet csak STEP formátumot támogat (.step, .stp)
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
                <p className="text-sm text-muted-foreground">STEP modell betöltése...</p>
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
