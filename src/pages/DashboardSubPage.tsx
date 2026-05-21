import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { ReactNode } from "react";

import AdminManagement from "./dashboard/AdminManagement";
import UserManagement from "./dashboard/UserManagement";
import ContentManagement from "./dashboard/ContentManagement";
import ExamManagement from "./dashboard/ExamManagement";
import LearningPage from "./dashboard/LearningPage";
import ExamsPage from "./dashboard/ExamsPage";
import ResultsPage from "./dashboard/ResultsPage";
import ReportsPage from "./dashboard/ReportsPage";
import SchedulingPage from "./dashboard/SchedulingPage";
import ProfilePage from "./dashboard/ProfilePage";

interface DashboardSubPageProps {
  page: string;
}

export default function DashboardSubPage({ page }: DashboardSubPageProps) {
  const pageMap: Record<string, ReactNode> = {
    admins: <AdminManagement />,
    users: <UserManagement />,
    content: <ContentManagement />,
    exams: <ExamManagement />,
    "exams-page": <ExamsPage />,
    learning: <LearningPage />,
    results: <ResultsPage />,
    reports: <ReportsPage />,
    scheduling: <SchedulingPage />,
    profile: <ProfilePage />,
  };

  return (
    <DashboardLayout>
      {pageMap[page] || <Navigate to="/dashboard" replace />}
    </DashboardLayout>
  );
}
