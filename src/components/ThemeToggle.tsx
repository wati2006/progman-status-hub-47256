import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      title={theme === "system" ? "Rendszer" : theme === "light" ? "Világos" : "Sötét"}
    >
      {theme === "system" && <Monitor className="h-[1.2rem] w-[1.2rem]" />}
      {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem]" />}
      {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem]" />}
      <span className="sr-only">Téma váltás</span>
    </Button>
  );
}
