import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users, UserCog, BookOpen, ClipboardList, TrendingUp, AlertTriangle,
  Activity, Award, BarChart3, Calendar, CheckCircle2, Clock, FileText,
  ChevronRight, Plus, Upload, ArrowUpRight, Target, Shield, MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["hsl(152,60%,40%)", "hsl(0,78%,42%)", "hsl(42,90%,50%)", "hsl(220,60%,22%)"];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState({ totalUsers: 0, totalAdmins: 0, totalCourses: 0, totalExams: 0 });
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAll() {
      const [usersRes, adminsRes, coursesRes, examsRes, recentExamsRes, resultsRes, profilesRes, allResults, adminRes, schedRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("admin_assignments").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("exams").select("id", { count: "exact", head: true }),
        supabase.from("exams").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("exam_results").select("*, exams(title)").order("submitted_at", { ascending: false }).limit(8),
        supabase.from("profiles").select("*"),
        supabase.from("exam_results").select("*"),
        supabase.from("admin_assignments").select("*"),
        supabase.from("exam_schedules").select("*").order("scheduled_date", { ascending: true }).limit(5),
      ]);
      setStats({
        totalUsers: usersRes.count || 0,
        totalAdmins: adminsRes.count || 0,
        totalCourses: coursesRes.count || 0,
        totalExams: examsRes.count || 0,
      });
      setRecentExams(recentExamsRes.data || []);
      setRecentResults(resultsRes.data || []);
      setProfiles(profilesRes.data || []);
      setResults(allResults.data || []);
      setAdmins(adminRes.data || []);
      setSchedules(schedRes.data || []);
    }
    fetchAll();
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timerId);
  }, []);

  const attemptedUserIds = new Set(results.map(r => r.user_id));
  const notAttemptedCount = profiles.filter(p => !attemptedUserIds.has(p.user_id)).length;

  const userPerfs = useMemo(() => {
    const map: Record<string, { obtained: number; total: number; name: string; hrms: string; location: string }> = {};
    results.forEach(r => {
      const p = profiles.find(pr => pr.user_id === r.user_id);
      if (!map[r.user_id]) map[r.user_id] = { obtained: 0, total: 0, name: p?.full_name || r.hrms_id, hrms: r.hrms_id, location: p?.location || "" };
      map[r.user_id].obtained += r.obtained_marks;
      map[r.user_id].total += r.total_marks;
    });
    return Object.entries(map).map(([, d]) => ({
      ...d, avgPercent: d.total > 0 ? Math.round((d.obtained / d.total) * 100) : 0,
    }));
  }, [results, profiles]);

  const lowPerformers = userPerfs.filter(u => u.avgPercent < 60);
  const passedCount = userPerfs.filter(u => u.avgPercent >= 60).length;
  const totalAvg = userPerfs.length > 0 ? Math.round(userPerfs.reduce((s, u) => s + u.avgPercent, 0) / userPerfs.length) : 0;

  const tiLocMap: Record<string, string> = {};
  admins.forEach(a => { tiLocMap[a.location] = a.admin_name; });

  const locationPerformance = useMemo(() => {
    const acc: Record<string, { total: number; count: number; users: number }> = {};
    userPerfs.forEach(u => {
      const loc = u.location || "Unknown";
      if (!acc[loc]) acc[loc] = { total: 0, count: 0, users: 0 };
      acc[loc].total += u.avgPercent;
      acc[loc].count += 1;
      acc[loc].users += 1;
    });
    return Object.entries(acc).map(([loc, d]) => ({
      location: tiLocMap[loc] || loc,
      avgScore: d.count > 0 ? Math.round(d.total / d.count) : 0,
      users: d.users,
    }));
  }, [userPerfs, tiLocMap]);

  const completionData = [
    { name: "Passed", value: passedCount },
    { name: "Failed", value: lowPerformers.length },
    { name: "Not Attempted", value: notAttemptedCount },
  ];

  const getScheduleStatus = (scheduleDate: string, startTime: string, endTime: string) => {
    const start = new Date(`${scheduleDate}T${startTime}`);
    const end = new Date(`${scheduleDate}T${endTime}`);

    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "active";
    return "completed";
  };

  const upcomingSchedules = schedules.filter((s) => getScheduleStatus(s.scheduled_date, s.start_time, s.end_time) !== "completed");

  const topPerformers = [...userPerfs].sort((a, b) => b.avgPercent - a.avgPercent).slice(0, 5);

  const anim = (delay = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.35 } });

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <motion.div {...anim()} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
           <Shield className="w-6 h-6 text-railway-gold" />
            {t("commandCenter")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("commandCenterDesc")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate("/dashboard/exams")} className="bg-railway-navy hover:bg-railway-navy-light text-primary-foreground">
            <Plus className="w-3.5 h-3.5 mr-1" /> {t("newExam")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/content")}>
            <Upload className="w-3.5 h-3.5 mr-1" /> {t("uploadContent")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/reports")}>
            <BarChart3 className="w-3.5 h-3.5 mr-1" /> {t("fullReports")}
          </Button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div {...anim(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="cursor-pointer" onClick={() => navigate("/dashboard/users")}>
          <StatsCard title={t("totalUsers")} value={stats.totalUsers} icon={<Users className="w-5 h-5" />} trend={`${passedCount} ${t("passed")}`} trendUp />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/dashboard/admins")}>
          <StatsCard title={t("adminsTI")} value={stats.totalAdmins} icon={<UserCog className="w-5 h-5" />} trend={`${locationPerformance.length} ${t("locations")}`} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/dashboard/content")}>
          <StatsCard title={t("learningMaterials")} value={stats.totalCourses} icon={<BookOpen className="w-5 h-5" />} trend={t("published")} trendUp />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/dashboard/exams")}>
          <StatsCard title={t("totalExams")} value={stats.totalExams} icon={<ClipboardList className="w-5 h-5" />} trend={`${results.length} ${t("submissions")}`} trendUp />
        </div>
      </motion.div>

      {/* Key Metrics Row */}
      <motion.div {...anim(0.1)} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/reports")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAvg}%</p>
              <p className="text-xs text-muted-foreground">{t("avgScore")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/reports")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-railway-gold/10 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-railway-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userPerfs.length}</p>
              <p className="text-xs text-muted-foreground">{t("usersAssessed")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/reports")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowPerformers.length}</p>
              <p className="text-xs text-muted-foreground">{t("lowPerformers")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/reports")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notAttemptedCount}</p>
              <p className="text-xs text-muted-foreground">{t("notAttempted")}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts + Top Performers */}
      <motion.div {...anim(0.15)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* TI-wise Bar Chart */}
        <Card className="lg:col-span-2 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/reports")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-railway-gold" /> {t("tiWisePerformance")}</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={locationPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="location" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Bar dataKey="avgScore" fill="hsl(220,60%,22%)" name="Avg Score %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users" fill="hsl(42,90%,50%)" name="Users" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass/Fail Pie */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/reports")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-railway-gold" /> {t("passFail")}</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={completionData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={4}>
                  {completionData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 text-xs justify-center">
              {completionData.map((d, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  {d.name}: <strong>{d.value}</strong>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Middle Row: Top Performers + Upcoming Schedules + Location Breakdown */}
      <motion.div {...anim(0.2)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Top Performers */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/reports")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">🏆 {t("topPerformers")}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topPerformers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : topPerformers.map((u, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-railway-gold/10 text-railway-gold flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium leading-tight">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{u.hrms} • {u.location}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">{u.avgPercent}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Schedules */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/scheduling")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-railway-gold" /> {t("upcomingSchedules")}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("noUpcoming")}</p>
            ) : upcomingSchedules.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                <div>
                  <p className="text-sm font-medium leading-tight">{s.exam_title}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {s.admin_name} •{" "}
                    {new Date(s.scheduled_date).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</p>
                  <Badge variant="outline" className="text-[10px] mt-0.5">{getScheduleStatus(s.scheduled_date, s.start_time, s.end_time)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Location Breakdown */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/reports")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-railway-gold" /> {t("locationBreakdown")}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {locationPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            ) : locationPerformance.map((loc) => (
              <div key={loc.location} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{loc.location}</span>
                  <span className="text-xs text-muted-foreground">{loc.users} {t("users")} • <span className={cn("font-bold", loc.avgScore >= 60 ? "text-green-600" : "text-destructive")}>{loc.avgScore}%</span></span>
                </div>
                <Progress value={loc.avgScore} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Row */}
      <motion.div {...anim(0.25)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Exams */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/exams")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-railway-gold" /> {t("recentExams")}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentExams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("noExamsYet")}</p>
            ) : recentExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                <div>
                  <p className="text-sm font-medium">{exam.title}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {exam.duration_minutes} {lang === "hi" ? "मिनट" : "min"} • {new Date(exam.created_at).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <Badge variant={exam.is_active ? "default" : "secondary"} className="text-[10px]">
                  {exam.is_active ? "Active" : "Draft"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/reports")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> {t("recentSubmissions")}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("noResultsYet")}</p>
            ) : recentResults.map((r) => {
              const pct = r.total_marks > 0 ? Math.round((r.obtained_marks / r.total_marks) * 100) : 0;
              const profile = profiles.find(p => p.user_id === r.user_id);
              return (
                <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">{profile?.full_name || r.hrms_id}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(r.exams as any)?.title} • HRMS: {r.hrms_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-sm font-bold", pct >= 60 ? "text-green-600" : "text-destructive")}>
                      {pct}%
                    </span>
                    <p className="text-[10px] text-muted-foreground">{r.obtained_marks}/{r.total_marks}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
