import { NavLink } from "react-router-dom";
import { LayoutDashboard, CreditCard, TrendingDown, TrendingUp, Target, Shield, Lightbulb, Upload, X, Receipt } from "lucide-react";

const NAV = [
  { to: "/",               icon: LayoutDashboard, label: "Overview" },
  { to: "/accounts",       icon: CreditCard,      label: "Accounts" },
  { to: "/spending",       icon: TrendingDown,    label: "Spending" },
  { to: "/investments",    icon: TrendingUp,      label: "Investments" },
  { to: "/goals",          icon: Target,          label: "Goals" },
  { to: "/emergency-fund", icon: Shield,          label: "Emergency Fund" },
  { to: "/tax",            icon: Receipt,         label: "Tax" },
  { to: "/recommendations",icon: Lightbulb,       label: "Tips" },
  { to: "/uploads",        icon: Upload,          label: "Uploads" },
];

interface Props { onClose?: () => void; }

export function Sidebar({ onClose }: Props) {
  return (
    <aside className="w-60 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
        <span className="text-lg font-bold text-white tracking-tight">Finance</span>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden"><X size={18} /></button>
        )}
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? "bg-emerald-600 text-white font-medium" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
