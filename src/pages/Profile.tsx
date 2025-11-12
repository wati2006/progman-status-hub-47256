import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, Trash2, Upload, Loader2 } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  discord_profile: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [discordProfile, setDiscordProfile] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadProfile(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setDepartment(data.department || "");
        setDiscordProfile(data.discord_profile || "");
        setAvatarUrl(data.avatar_url);
      }
    } catch (error: any) {
      toast({
        title: "Hiba történt",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    
    setIsUploadingAvatar(true);
    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        await supabase.storage.from('avatars').remove([avatarUrl]);
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: fileName })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(fileName);
      setAvatarFile(null);
      
      toast({
        title: "Sikeres feltöltés",
        description: "A profilkép frissítve lett."
      });
    } catch (error: any) {
      toast({
        title: "Hiba történt",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user || !avatarUrl) return;

    try {
      // Delete from storage
      await supabase.storage.from('avatars').remove([avatarUrl]);

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarUrl(null);
      setShowDeleteDialog(false);
      
      toast({
        title: "Sikeres törlés",
        description: "A profilkép törölve lett."
      });
    } catch (error: any) {
      toast({
        title: "Hiba történt",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      // Upload avatar if selected
      if (avatarFile) {
        await handleAvatarUpload(avatarFile);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          department: department || null,
          discord_profile: discordProfile || null
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Sikeres mentés",
        description: "A profil adataid frissítve lettek."
      });

      await loadProfile(user.id);
    } catch (error: any) {
      toast({
        title: "Hiba történt",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törölni szeretnéd a profilképet?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem vonható vissza. A profilkép véglegesen törlődik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAvatar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Profil</h1>
              <p className="text-sm text-muted-foreground">
                Személyes adatok és beállítások
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl ? getAvatarUrl(avatarUrl) || undefined : undefined} />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Felhasználói adatok</CardTitle>
                <CardDescription>
                  Kezeld a személyes információidat
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label>Profilkép</Label>
                {avatarUrl ? (
                  <div className="flex items-center gap-3 p-3 border rounded-md bg-card">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getAvatarUrl(avatarUrl) || undefined} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground flex-1">Profilkép feltöltve</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : isUploadingAvatar ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-primary/10">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-primary font-medium">Profilkép feltöltése...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const maxSize = 2 * 1024 * 1024; // 2MB in bytes
                          if (file.size > maxSize) {
                            toast({
                              title: "Túl nagy fájl",
                              description: "A profilkép maximum 2MB lehet.",
                              variant: "destructive"
                            });
                            e.target.value = ""; // Reset input
                            return;
                          }
                          setAvatarFile(file);
                        } else {
                          setAvatarFile(null);
                        }
                      }}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tölts fel egy profilképet (JPG, PNG, max 2MB)
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email cím</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Az email cím nem módosítható
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Teljes név</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Add meg a teljes neved"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Részleg</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz részleget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aero">Aero</SelectItem>
                    <SelectItem value="Elektronika">Elektronika</SelectItem>
                    <SelectItem value="Futómű">Futómű</SelectItem>
                    <SelectItem value="Motor">Motor</SelectItem>
                    <SelectItem value="Váz">Váz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discord_profile">Discord profil</Label>
                <Input
                  id="discord_profile"
                  type="text"
                  value={discordProfile}
                  onChange={(e) => setDiscordProfile(e.target.value)}
                  placeholder="username#1234"
                />
                <p className="text-xs text-muted-foreground">
                  Opcionális
                </p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fiók létrehozva:</span>
                  <span className="font-medium">
                    {profile?.created_at ? formatDate(profile.created_at) : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Utoljára frissítve:</span>
                  <span className="font-medium">
                    {profile?.updated_at ? formatDate(profile.updated_at) : "-"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Mentés..." : "Mentés"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/")}>
                  Vissza
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      </div>
    </>
  );
};

export default Profile;
