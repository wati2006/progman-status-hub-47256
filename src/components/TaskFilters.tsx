import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  modulFilter: string;
  onModulFilterChange: (value: string) => void;
  modules: string[];
}

export const TaskFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  modulFilter,
  onModulFilterChange,
  modules,
}: TaskFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="space-y-2">
        <Label>Keresés</Label>
        <Input
          placeholder="Keresés feladat vagy leírás alapján..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Modul szűrés</Label>
        <Select value={modulFilter} onValueChange={onModulFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Összes modul" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes modul</SelectItem>
            {modules.map((module) => (
              <SelectItem key={module} value={module}>
                {module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Státusz szűrés</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Összes státusz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes státusz</SelectItem>
            <SelectItem value="terv">Terv</SelectItem>
            <SelectItem value="folyamatban">Folyamatban</SelectItem>
            <SelectItem value="kesz">Kész</SelectItem>
            <SelectItem value="elvetve">Elvetve</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
