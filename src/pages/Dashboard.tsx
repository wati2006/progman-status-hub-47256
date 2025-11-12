import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Plus, User as UserIcon, Users } from "lucide-react";
import { TaskTable } from "@/components/TaskTable";
import { TaskForm } from "@/components/TaskForm";
import { TaskFilters } from "@/components/TaskFilters";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

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
const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      // Load user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();
      
      if (profile) {
        setUserProfile(profile);
      }
    };
    checkAuth();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        // Load user profile with setTimeout to prevent deadlock
        setTimeout(() => {
          supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", session.user.id)
            .maybeSingle()
            .then(({ data: profile }) => {
              if (profile) {
                setUserProfile(profile);
              }
            });
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const {
    data: parts = [],
    isLoading
  } = useQuery({
    queryKey: ["parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("*, profiles!parts_created_by_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Part[];
    },
    enabled: !!user
  });
  const departments = useMemo(() => {
    const uniqueDepartments = new Set(parts.map(part => part.department));
    return Array.from(uniqueDepartments).sort();
  }, [parts]);

  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      const matchesSearch = 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || part.status === statusFilter;
      const matchesDepartment = departmentFilter === "all" || part.department === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [parts, searchTerm, statusFilter, departmentFilter]);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Kijelentkezve",
      description: "Sikeresen kijelentkeztél a rendszerből."
    });
  };
  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPart(null);
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Betöltés...</div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Alkatrészkatalógus</h1>
              <p className="text-sm text-muted-foreground">
                Formula Student alkatrészek nyilvántartása
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url ? getAvatarUrl(userProfile.avatar_url) || undefined : undefined} />
                  <AvatarFallback className="bg-primary/10">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                {(userProfile?.full_name || user?.user_metadata?.full_name) && (
                  <span className="text-sm text-foreground font-medium">
                    {userProfile?.full_name || user?.user_metadata?.full_name}
                  </span>
                )}
              </div>
              <ThemeToggle />
              <Button variant="outline" onClick={() => navigate("/members")}>
                <Users className="mr-2 h-4 w-4" />
                Csapattagok
              </Button>
              <Button variant="outline" onClick={() => navigate("/profile")}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profil
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Kijelentkezés
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Alkatrészek</h2>
            <p className="text-sm text-muted-foreground">
              {filteredParts.length} alkatrész {searchTerm || statusFilter !== "all" || departmentFilter !== "all" ? "szűrve" : "összesen"}
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Új alkatrész
          </Button>
        </div>

        <TaskFilters 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          statusFilter={statusFilter} 
          onStatusFilterChange={setStatusFilter} 
          modulFilter={departmentFilter} 
          onModulFilterChange={setDepartmentFilter} 
          modules={departments} 
        />

        <TaskTable parts={filteredParts} onEdit={handleEdit} />
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPart ? "Alkatrész szerkesztése" : "Új alkatrész létrehozása"}
            </DialogTitle>
          </DialogHeader>
          <TaskForm part={editingPart} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>;
};
export default Dashboard;