import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Monitor,
  Wifi,
  Activity,
  Users,
  Settings,
} from "lucide-react";

const tabIcons: Record<string, React.FC<{ className?: string }>> = {
  overview: LayoutDashboard,
  devices: Users,
  hotspot: Wifi,
  monitor: Activity,
  room: Monitor,
  settings: Settings,
};

interface Tab {
  readonly id: string;
  readonly label: string;
}

interface TabBarProps {
  tabs: readonly Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex border-b border-border bg-card/50 px-2 shrink-0">
      {tabs.map((tab) => {
        const Icon = tabIcons[tab.id];
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
