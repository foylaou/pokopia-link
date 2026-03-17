import { useState } from "react";
import { ToastProvider } from "./components/shared/Toast";
import TitleBar from "./components/layout/TitleBar";
import TabBar from "./components/layout/TabBar";
import FloatWidget from "./components/shared/FloatWidget";
import Overview from "./pages/Overview";
import Devices from "./pages/Devices";
import Hotspot from "./pages/Hotspot";
import Monitor from "./pages/Monitor";
import Room from "./pages/Room";
import Settings from "./pages/Settings";

const isFloatWindow =
  new URLSearchParams(window.location.search).get("window") === "float";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "devices", label: "Devices" },
  { id: "hotspot", label: "Hotspot" },
  { id: "monitor", label: "Monitor" },
  { id: "room", label: "Room" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const pages: Record<TabId, React.FC> = {
  overview: Overview,
  devices: Devices,
  hotspot: Hotspot,
  monitor: Monitor,
  room: Room,
  settings: Settings,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (isFloatWindow) {
    return <FloatWidget />;
  }

  const Page = pages[activeTab];

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-background text-foreground rounded-lg overflow-hidden border border-border">
        <TitleBar />
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />
        <main className="flex-1 overflow-auto p-6">
          <Page />
        </main>
      </div>
    </ToastProvider>
  );
}
