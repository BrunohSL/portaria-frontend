"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Building2, Phone, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sidebar-collapsed";

interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: string[] }

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADM"] },
  { href: "/condominios", label: "Condominios", icon: Building2, roles: ["ADM", "CLIENT_ADM", "SUPPORT"] },
  { href: "/chamadas", label: "Chamadas", icon: Phone, roles: ["ADM", "CLIENT_ADM", "SUPPORT"] },
  { href: "/auditoria", label: "Auditoria", icon: ClipboardList, roles: ["ADM"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === "true");
    setMounted(true);
  }, []);

  const toggleCollapsed = () => { const next = !collapsed; setCollapsed(next); localStorage.setItem(STORAGE_KEY, String(next)); };

  const filteredItems = navItems.filter((item) => user && item.roles.includes(user.role)).map((item) => {
    if (item.href === "/condominios" && user?.role === "CLIENT_ADM" && user.condominium_id) {
      return { ...item, href: `/condominios/${user.condominium_id}` };
    }
    return item;
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  if (!mounted) return <aside className="hidden lg:flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border" />;

  return (
    <aside className={cn("hidden lg:flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out", collapsed ? "w-16" : "w-64")}>
      <Link href="/dashboard" className={cn("flex h-14 items-center border-b border-sidebar-border px-4 shrink-0 transition-opacity hover:opacity-80", collapsed ? "justify-center" : "gap-2")}>
        <Building2 className="size-6 shrink-0" />
        {!collapsed && <span className="font-semibold text-sm">Portaria</span>}
      </Link>
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="flex flex-col gap-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const linkContent = (
              <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", collapsed && "justify-center px-0", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                <Icon className="size-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
            if (collapsed) {
              return (<li key={item.href}><Tooltip><TooltipTrigger render={<div />}>{linkContent}</TooltipTrigger><TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent></Tooltip></li>);
            }
            return <li key={item.href}>{linkContent}</li>;
          })}
        </ul>
      </nav>
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={toggleCollapsed} className={cn("w-full text-sidebar-foreground/70 hover:bg-sidebar-accent/50", collapsed ? "justify-center" : "justify-end")} />}>
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>{collapsed ? "Expandir menu" : "Recolher menu"}</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
