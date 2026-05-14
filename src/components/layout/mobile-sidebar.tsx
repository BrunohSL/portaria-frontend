"use client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Building2, Phone, ClipboardList, UserCog } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADM"] },
  { href: "/condominios", label: "Condominios", icon: Building2, roles: ["ADM", "CLIENT_ADM", "SUPPORT"] },
  { href: "/chamadas", label: "Chamadas", icon: Phone, roles: ["ADM", "CLIENT_ADM", "SUPPORT"] },
  { href: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["ADM", "CLIENT_ADM"] },
  { href: "/auditoria", label: "Auditoria", icon: ClipboardList, roles: ["ADM"] },
];

interface Props { open: boolean; onOpenChange: (open: boolean) => void }

export function MobileSidebar({ open, onOpenChange }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const filtered = navItems.filter((item) => user && item.roles.includes(user.role));
  const isActive = (href: string) => href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <img src="/logo-completo.png" alt="Portaria" className="h-8" />
        </div>
        <nav className="flex-1 py-4 px-2">
          <ul className="flex flex-col gap-1">
            {filtered.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => onOpenChange(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}>
                    <Icon className="size-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
