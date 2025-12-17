import React, { useState } from "react";
import { useAuth } from "../context/auth";
import {
  LayoutDashboard,
  Users,
  School,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate, useLocation, Outlet } from "react-router-dom";
import Logo from "../components/Logo";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigation = [
    {
      name: "Genel Bakış",
      href: "/dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    { name: "Öğrenciler", href: "/dashboard/students", icon: Users },
    { name: "Öğretmenler", href: "/dashboard/teachers", icon: GraduationCap },
    { name: "Sınıflar", href: "/dashboard/classes", icon: School },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="ltr">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-800/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center h-16 px-4 border-b border-gray-100">
          <Logo className="text-gray-900" iconClassName="h-5 w-5 text-black" />
        </div>

        <nav className="p-2 space-y-0.5">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <item.icon className="h-3.5 w-3.5 mr-2" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <div className="flex items-center mb-3 px-1">
            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-[10px] font-medium text-gray-600">
                {user?.username?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-900 truncate max-w-[100px]">
                {user?.username}
              </p>
              <p className="text-[9px] text-gray-500">Yönetici</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition"
          >
            <LogOut className="h-3 w-3 mr-1.5" />
            Çıkış
          </button>
        </div>
      </div>

      {/* Main Content Area - Missing in previous edits, ensuring it is here now implicitly if it was here before or if I need to add it.
          Wait, looking at the original file content provided in the first turn, there was no <Outlet /> visible in the first 100 lines, 
          but it imported `Outlet`. It must be after the Sidebar div.
          I should read the file again to make sure I don't lose the <Outlet /> part if it was further down.
      */}
      <div className="lg:pl-56 flex flex-col min-h-screen">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
