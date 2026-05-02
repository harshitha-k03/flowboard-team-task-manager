import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AIAssistantChatbot } from "@/components/ai/AIAssistantChatbot";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="px-5 pb-10 pt-24 sm:px-8">
          <Outlet />
        </main>
      </div>
      <AIAssistantChatbot />
    </div>
  );
}
