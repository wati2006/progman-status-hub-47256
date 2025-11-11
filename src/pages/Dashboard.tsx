import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Plus } from "lucide-react";
import { TaskTable } from "@/components/TaskTable";
import { TaskForm } from "@/components/TaskForm";
import { TaskFilters } from "@/components/TaskFilters";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
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
const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modulFilter, setModulFilter] = useState("all");
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
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
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const {
    data: tasks = [],
    isLoading
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tasks").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user
  });
  const modules = useMemo(() => {
    const uniqueModules = new Set(tasks.map(task => task.modul));
    return Array.from(uniqueModules).sort();
  }, [tasks]);
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.feladat.toLowerCase().includes(searchTerm.toLowerCase()) || task.leiras?.toLowerCase().includes(searchTerm.toLowerCase()) || task.modul.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.statusz === statusFilter;
      const matchesModul = modulFilter === "all" || task.modul === modulFilter;
      return matchesSearch && matchesStatus && matchesModul;
    });
  }, [tasks, searchTerm, statusFilter, modulFilter]);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Kijelentkezve",
      description: "Sikeresen kijelentkeztél a rendszerből."
    });
  };
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
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
              <h1 className="text-2xl font-bold text-foreground">Függőségek Tára / Alkatrészkatalógus</h1>
              <p className="text-sm text-muted-foreground">
                Gyártási feladatok nyilvántartása
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Kijelentkezés
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Feladatok</h2>
            <p className="text-sm text-muted-foreground">
              {filteredTasks.length} feladat {searchTerm || statusFilter !== "all" || modulFilter !== "all" ? "szűrve" : "összesen"}
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Új feladat
          </Button>
        </div>

        <TaskFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} modulFilter={modulFilter} onModulFilterChange={setModulFilter} modules={modules} />

        <TaskTable tasks={filteredTasks} onEdit={handleEdit} />
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Feladat szerkesztése" : "Új feladat létrehozása"}
            </DialogTitle>
          </DialogHeader>
          <TaskForm task={editingTask} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>;
};
export default Dashboard;