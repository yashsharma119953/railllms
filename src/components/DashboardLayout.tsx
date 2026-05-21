import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  BarChart3,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  Train,
  UserCog,
  Upload,
  ClipboardList,
  Languages,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { role, profile, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const superAdminNav: NavItem[] = [
    { label: t("navDashboard"), href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: t("navAdminMgmt"), href: "/dashboard/admins", icon: <UserCog className="w-5 h-5" /> },
    { label: t("navContentUpload"), href: "/dashboard/content", icon: <Upload className="w-5 h-5" /> },
    { label: t("navExamMgmt"), href: "/dashboard/exams", icon: <ClipboardList className="w-5 h-5" /> },
    { label: t("navScheduling"), href: "/dashboard/scheduling", icon: <CalendarDays className="w-5 h-5" /> },
    { label: t("navReports"), href: "/dashboard/reports", icon: <BarChart3 className="w-5 h-5" /> },
    { label: t("navAllUsers"), href: "/dashboard/users", icon: <Users className="w-5 h-5" /> },
    { label: t("navProfile"), href: "/dashboard/profile", icon: <Settings className="w-5 h-5" /> },
  ];

  const adminNav: NavItem[] = [
    { label: t("navDashboard"), href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: t("navUserMgmt"), href: "/dashboard/users", icon: <Users className="w-5 h-5" /> },
    { label: t("navAssignContent"), href: "/dashboard/content", icon: <BookOpen className="w-5 h-5" /> },
    { label: t("navViewResults"), href: "/dashboard/results", icon: <FileText className="w-5 h-5" /> },
    { label: t("navProfile"), href: "/dashboard/profile", icon: <Settings className="w-5 h-5" /> },
  ];

  const userNav: NavItem[] = [
    { label: t("navDashboard"), href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: t("navLearning"), href: "/dashboard/learning", icon: <BookOpen className="w-5 h-5" /> },
    { label: t("navExams"), href: "/dashboard/exams-page", icon: <ClipboardList className="w-5 h-5" /> },
    { label: t("navProfile"), href: "/dashboard/profile", icon: <Settings className="w-5 h-5" /> },
  ];

  const navItems = role === "super_admin" ? superAdminNav : role === "admin" ? adminNav : userNav;
  const roleLabel = role === "super_admin" ? t("roleSrDOM") : role === "admin" ? t("roleTI") : t("roleEmployee");

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col gradient-navy transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-railway-gold flex items-center justify-center">
            <Train className="w-5 h-5 text-railway-gold-foreground" />
          </div>
          <div>
            <p className="text-sm font-heading font-bold text-sidebar-foreground">{t("railwayLms")}</p>
            <p className="text-xs text-sidebar-foreground/50">{t("prayagrajDiv")}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />
            {lang === "en" ? "हिन्दी में बदलें" : "Switch to English"}
          </button>

          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-railway-gold text-railway-gold-foreground text-xs font-bold">
                {profile?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-sidebar-foreground/50">{roleLabel}</p>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut();
              toast.success(lang === "hi" ? "सफलतापूर्वक लॉग आउट हो गए" : "Logged out successfully");
              navigate("/");
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t("logout")}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 px-4 lg:px-6 py-3 bg-card border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">{profile?.location && `📍 ${profile.location}`}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-railway-gold/10 text-railway-gold border border-railway-gold/20">
              {roleLabel}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
              {lang === "en" ? "EN" : "हि"}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}