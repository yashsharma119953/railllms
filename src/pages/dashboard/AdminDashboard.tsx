import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, ClipboardList, AlertTriangle, TrendingUp, TrendingDown, Plus, Eye, EyeOff, Copy, KeyRound, Trash2, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const COLORS = ["#1a3654", "#d4a843", "#e74c3c", "#27ae60", "#3498db", "#9b59b6"];

const monthlyPerformance = [
  { month: "Oct", avgScore: 62, examsGiven: 18, passRate: 65 },
  { month: "Nov", avgScore: 68, examsGiven: 22, passRate: 72 },
  { month: "Dec", avgScore: 71, examsGiven: 25, passRate: 75 },
  { month: "Jan", avgScore: 74, examsGiven: 30, passRate: 78 },
  { month: "Feb", avgScore: 78, examsGiven: 28, passRate: 82 },
  { month: "Mar", avgScore: 82, examsGiven: 35, passRate: 85 },
];

const categoryData = [
  { subject: "Safety", score: 85, fullMark: 100 },
  { subject: "Signals", score: 72, fullMark: 100 },
  { subject: "Track", score: 68, fullMark: 100 },
  { subject: "Protocol", score: 90, fullMark: 100 },
  { subject: "Emergency", score: 76, fullMark: 100 },
];

const passFailData = [
  { name: "Passed", value: 18, color: "#27ae60" },
  { name: "Failed", value: 4, color: "#e74c3c" },
  { name: "Pending", value: 2, color: "#d4a843" },
];

const userPerformanceList = [
  { name: "Ramesh Kumar", station: "SKB", hrms: "HRM001", score: 92, status: "good", trend: "up" },
  { name: "Suresh Yadav", station: "PYG", hrms: "HRM002", score: 78, status: "good", trend: "up" },
  { name: "Amit Singh", station: "ALD", hrms: "HRM003", score: 45, status: "low", trend: "down" },
  { name: "Priya Sharma", station: "MNK", hrms: "HRM004", score: 88, status: "good", trend: "up" },
  { name: "Rajesh Patel", station: "SKB", hrms: "HRM005", score: 38, status: "low", trend: "down" },
  { name: "Sunita Devi", station: "PYG", hrms: "HRM006", score: 71, status: "good", trend: "up" },
];

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

interface CreatedUser {
  name: string;
  userId: string;
  password: string;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { t, lang } = useLanguage();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", station: "", hrmsId: "" });
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const password = generatePassword();
    const userId = `USR_${form.hrmsId || Date.now()}`;
    setCreatedUsers(prev => [...prev, { name: form.name, userId, password }]);
    toast.success(`User "${form.name}" created successfully!`);
    setCreateOpen(false);
    setForm({ name: "", station: "", hrmsId: "" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t("adminDashboard")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("roleTI")} {profile?.location || ""} — {t("adminDashboardDesc")}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-railway-navy hover:bg-railway-navy-light text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> {t("createUserId")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("createUserAccount")}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("fullName")}</Label>
                <Input placeholder={t("employeeName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("station")}</Label>
                <Input placeholder="e.g., SKB" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("hrmsId")}</Label>
                <Input placeholder="HRMS ID" value={form.hrmsId} onChange={(e) => setForm({ ...form, hrmsId: e.target.value })} required />
              </div>
              <p className="text-xs text-muted-foreground">{t("autoGenPwd")}</p>
              <Button type="submit" className="w-full">{t("createUser")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t("totalUsers")} value={24} icon={<Users className="w-5 h-5" />} trend={lang === "hi" ? "+3 इस महीने" : "+3 this month"} trendUp />
        <StatsCard title={t("examsConduc")} value={35} icon={<ClipboardList className="w-5 h-5" />} trend={lang === "hi" ? "+7 इस महीने" : "+7 this month"} trendUp />
        <StatsCard title={t("avgScore")} value="78%" icon={<BookOpen className="w-5 h-5" />} trend={lang === "hi" ? "+4% सुधार" : "+4% improvement"} trendUp />
        <StatsCard title={t("lowPerformers")} value={4} icon={<AlertTriangle className="w-5 h-5" />} trend={t("needsAttention")} />
      </motion.div>

      {/* Created Users Passwords */}
      {createdUsers.length > 0 && (
        <Card className="border-railway-gold/30 bg-railway-gold/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-railway-gold" /> {t("createdUserCreds")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {createdUsers.map((u, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border border-border bg-background gap-2">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">User ID: {u.userId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {showPasswords[i] ? u.password : "••••••••••"}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPasswords(p => ({ ...p, [i]: !p[i] }))}>
                      {showPasswords[i] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(u.password)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row 1: Performance Trend + Pass/Fail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">📈 {t("perfTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyPerformance}>
                <defs>
                  <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a3654" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1a3654" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27ae60" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#27ae60" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="#1a3654" fill="url(#gradScore)" strokeWidth={2} />
                <Area type="monotone" dataKey="passRate" name="Pass Rate %" stroke="#27ae60" fill="url(#gradPass)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎯 {t("passFailDist")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={passFailData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {passFailData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Category Radar + Exams Given Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🕸️ {t("categoryProf")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={categoryData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#d4a843" fill="#d4a843" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 {t("monthlyExams")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="examsGiven" name="Exams" fill="#1a3654" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">👥 {t("userPerfOverview")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("station")}</TableHead>
                <TableHead>{t("hrmsId")}</TableHead>
                <TableHead>{t("score")}</TableHead>
                <TableHead>{t("trend")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userPerformanceList.map((user) => (
                <TableRow key={user.hrms}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.station}</TableCell>
                  <TableCell className="font-mono text-xs">{user.hrms}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={user.score} className="h-2 w-16" />
                      <span className="text-sm font-medium">{user.score}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-railway-green" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.status === "low"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-railway-green/10 text-railway-green"
                    }`}>
                      {user.status === "low" ? t("needsAttention") : t("good")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
