"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/providers/error-boundary";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, isLoading, router]);

  if (isLoading || status !== "authenticated") {
    return (
      <div className="flex h-screen">
        <div className="hidden lg:flex h-screen w-64 flex-col border-r bg-sidebar p-4 gap-4">
          <Skeleton className="h-14 w-full" />
          <div className="flex flex-col gap-2 mt-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}</div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b flex items-center px-6"><Skeleton className="h-5 w-32" /></div>
          <div className="flex-1 p-6"><Skeleton className="h-64 w-full rounded-lg" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
