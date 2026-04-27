import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { Overview } from "./pages/Overview";
import { Accounts } from "./pages/Accounts";
import { Spending } from "./pages/Spending";
import { Investments } from "./pages/Investments";
import { Goals } from "./pages/Goals";
import { EmergencyFund } from "./pages/EmergencyFund";
import { Recommendations } from "./pages/Recommendations";
import { Tax } from "./pages/Tax";
import { Uploads } from "./pages/Uploads";

const PAGE_TITLES: Record<string, string> = {
  "/":               "Overview",
  "/accounts":       "Accounts",
  "/spending":       "Spending",
  "/investments":    "Investments",
  "/goals":          "Goals",
  "/emergency-fund": "Emergency Fund",
  "/recommendations":"Recommendations",
  "/tax":            "Tax",
  "/uploads":        "Uploads",
};

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "Finance Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <div className="hidden lg:flex h-full">
        <Sidebar />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 h-full"><Sidebar onClose={() => setSidebarOpen(false)} /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"               element={<Overview />} />
            <Route path="/accounts"       element={<Accounts />} />
            <Route path="/spending"       element={<Spending />} />
            <Route path="/investments"    element={<Investments />} />
            <Route path="/goals"          element={<Goals />} />
            <Route path="/emergency-fund" element={<EmergencyFund />} />
            <Route path="/recommendations"element={<Recommendations />} />
            <Route path="/tax"            element={<Tax />} />
            <Route path="/uploads"        element={<Uploads />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><Layout /></BrowserRouter>;
}
