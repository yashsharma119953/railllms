import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import SuperAdminDashboard from "./dashboard/SuperAdminDashboard";
import AdminDashboard from "./dashboard/AdminDashboard";
import UserDashboard from "./dashboard/UserDashboard";

export default function Dashboard() {
  const { role } = useAuth();

  const DashboardContent = role === "super_admin" ? SuperAdminDashboard
    : role === "admin" ? AdminDashboard
    : UserDashboard;

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
