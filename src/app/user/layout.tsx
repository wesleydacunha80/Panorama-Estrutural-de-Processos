import { AppHeader } from "@/components/app-header";
import type { ReactNode } from "react";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen font-sans">
      <AppHeader />
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}