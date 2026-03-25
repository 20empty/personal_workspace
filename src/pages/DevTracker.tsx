import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Dashboard from "../components/devtracker/Dashboard";
import ProjectList from "../components/devtracker/ProjectList";
import KanbanBoard from "../components/devtracker/KanbanBoard";
import { LayoutDashboard, FileArchive, LayoutTemplate } from "lucide-react";

type TabType = "dashboard" | "projects" | "kanban";
type DevTrackerLocationState = {
  activeTab?: TabType;
  selectedProjectId?: string;
} | null;

export default function DevTracker() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  React.useEffect(() => {
    const state = location.state as DevTrackerLocationState;
    if (!state) return;
    if (state.selectedProjectId) {
      setSelectedProjectId(state.selectedProjectId);
    }
    if (state.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);

  return (
    <div className="flex h-full flex-col">
      {/* Header & Tabs */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Course Builder
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[color:var(--text)]">课件开发工作台</h1>
        </div>
        
        <div className="flex space-x-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] p-1">
          <TabButton 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
            icon={<LayoutDashboard size={16} />} 
            label="总览" 
          />
          <TabButton 
            active={activeTab === "projects"} 
            onClick={() => setActiveTab("projects")} 
            icon={<FileArchive size={16} />} 
            label="课程项目" 
          />
          <TabButton 
            active={activeTab === "kanban"} 
            onClick={() => setActiveTab("kanban")} 
            icon={<LayoutTemplate size={16} />} 
            label="交付物流转板" 
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden pb-4">
        {activeTab === "dashboard" && <div className="h-full overflow-y-auto"><Dashboard /></div>}
        {activeTab === "projects" && (
          <div className="h-full overflow-y-auto">
            <ProjectList
              onOpenBoard={(projectId) => {
                setSelectedProjectId(projectId);
                setActiveTab("kanban");
              }}
            />
          </div>
        )}
        {activeTab === "kanban" && (
          <KanbanBoard
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onBackToProjects={() => setActiveTab("projects")}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active 
          ? "bg-[color:var(--background)] text-[color:var(--text)] shadow-sm" 
          : "text-[color:var(--muted)] hover:bg-[color:var(--background)]/50 hover:text-[color:var(--text)]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
