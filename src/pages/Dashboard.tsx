import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import SuperAdminDashboard from "./dashboard/SuperAdminDashboard";
import AdminDashboard from "./dashboard/AdminDashboard";
import UserDashboard from "./dashboard/UserDashboard";

export default function Dashboard() {
  const { role, user, isHydrated } = useAuth();

  if (!isHydrated) {
    return null;
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  const DashboardContent = role === "super_admin" ? SuperAdminDashboard
    : role === "admin" ? AdminDashboard
    : UserDashboard;

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
