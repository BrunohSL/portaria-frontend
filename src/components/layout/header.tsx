"use client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface HeaderProps { onMenuClick: () => void }

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  return (
    <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6 shrink-0 bg-background">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}><Menu className="size-5" /></Button>
        <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout}><LogOut className="size-4" /></Button>
      </div>
    </header>
  );
}
