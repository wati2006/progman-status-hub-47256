import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User as UserIcon, Mail, Users as UsersIcon, Calendar, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  discord_profile: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Part {
  id: string;
  part_number: string;
  name: string;
  department: string;
  status: "terv" | "gyartas_alatt" | "kesz" | "jovahagyasra_var" | "elutasitva";
  created_at: string;
}

interface MemberProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartClick?: (partId: string) => void;
}

export const MemberProfileDialog = ({ userId, open, onOpenChange, onPartClick }: MemberProfileDialogProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId && open) {
      loadProfile();
      loadParts();
    }
  }, [userId, open]);

  const loadProfile = async () => {
    if (!userId) return;
    
    setIsLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Hiba történt",
        description: error.message || "Nem sikerült betölteni a profilt.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadParts = async () => {
    if (!userId) return;
    
    setIsLoadingParts(true);
    try {
      const { data, error } = await supabase
        .from("parts")
        .select("id, part_number, name, department, status, created_at")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setParts(data || []);
    } catch (error: any) {
      toast({
        title: "Hiba történt",
        description: error.message || "Nem sikerült betölteni az alkatrészeket.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingParts(false);
    }
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const getStatusLabel = (status: Part["status"]) => {
    const labels: Record<Part["status"], string> = {
      terv: "Terv",
      gyartas_alatt: "Gyártás alatt",
      kesz: "Kész",
      jovahagyasra_var: "Jóváhagyásra vár",
      elutasitva: "Elutasítva"
    };
    return labels[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("hu-HU");
  };

  if (!profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] mx-4 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Betöltés...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] mx-4 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
              <AvatarImage 
                src={profile.avatar_url ? getAvatarUrl(profile.avatar_url) || undefined : undefined} 
              />
              <AvatarFallback className="bg-primary/10">
                <UserIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <DialogTitle className="text-xl sm:text-2xl">
                {profile.full_name || "Névtelen"}
              </DialogTitle>
              {profile.department && (
                <Badge variant="secondary" className="mt-1">
                  {profile.department}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            {profile.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
            )}
            {profile.discord_profile && (
              <div className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <span>{profile.discord_profile}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Regisztrált: {formatDate(profile.created_at)}</span>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Hozzáadott alkatrészek ({parts.length})</h3>
            </div>

            {isLoadingParts ? (
              <p className="text-sm text-muted-foreground">Betöltés...</p>
            ) : parts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Még nem adott hozzá alkatrészt.</p>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Rajzszám</TableHead>
                      <TableHead className="whitespace-nowrap">Megnevezés</TableHead>
                      <TableHead className="whitespace-nowrap">Részleg</TableHead>
                      <TableHead className="whitespace-nowrap">Státusz</TableHead>
                      <TableHead className="whitespace-nowrap">Létrehozva</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part) => (
                      <TableRow 
                        key={part.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          onPartClick?.(part.id);
                          onOpenChange(false);
                        }}
                      >
                        <TableCell className="font-mono text-sm whitespace-nowrap">{part.part_number}</TableCell>
                        <TableCell className="whitespace-nowrap">{part.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{part.department}</TableCell>
                        <TableCell className="whitespace-nowrap">{getStatusLabel(part.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDate(part.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
