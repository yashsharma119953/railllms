import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Download, Users, TrendingUp, AlertTriangle, Activity, Target, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/StatsCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";

const COLORS = ["hsl(220, 60%, 22%)", "hsl(0, 78%, 42%)", "hsl(42, 90%, 50%)", "hsl(152, 60%, 40%)"];

interface UserPerf {
  user_id: string;
  full_name: string;
  hrms_id: string;
  cug_number: string;
  location: string;
  designation: string;
  totalExams: number;
  totalObtained: number;
  totalMarks: number;
  avgPercent: number;
  passed: boolean;
}

export default function ReportsPage() {
  const { t, lang } = useLanguage();
  const [results, setResults] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTI, setFilterTI] = useState("all");
  const [loading, setLoading] = useState(true);

  const resolveDisplayName = (profile: any, result: any, fallback = "Unknown") => {
    const candidateInfo = result?.answers?.candidate_info;
    return (
      result?.full_name ||
      candidateInfo?.full_name ||
      profile?.full_name ||
      profile?.username ||
      result?.name ||
      result?.user_name ||
      result?.hrms_id ||
      profile?.hrms_id ||
      fallback
    );
  };

  useEffect(() => {
    async function fetchAll() {
      const [resR, profR, examR, adminR] = await Promise.all([
        supabase.from("exam_results").select("*, exams(title)").order("submitted_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("exams").select("*"),
        supabase.from("admin_assignments").select("*"),
      ]);
      setResults(resR.data || []);
      setProfiles(profR.data || []);
      setExams(examR.data || []);
      setAdmins(adminR.data || []);
      setLoading(false);
    }
    fetchAll();
  }, []);

  // Map admin locations
  const tiLocations = useMemo(() => {
    const map: Record<string, string> = {};
    admins.forEach(a => { map[a.location] = a.admin_name; });
    return map;
  }, [admins]);

  // Build per-user performance
  const userPerformance: UserPerf[] = useMemo(() => {
    const map: Record<string, { hrms_id: string; full_name: string; cug_number: string; location: string; designation: string; obtained: number; total: number; count: number }> = {};
    
    results.forEach(r => {
      const profile = profiles.find(p => p.user_id === r.user_id);
      const key = r.user_id;
      if (!map[key]) {
        const candidateInfo = r.answers?.candidate_info;
        map[key] = {
          hrms_id: r.hrms_id || candidateInfo?.hrms_id || profile?.hrms_id || "-",
          full_name: resolveDisplayName(profile, r),
          cug_number: r.cug_number || candidateInfo?.cug_number || profile?.cug_number || "-",
          location: r.location || candidateInfo?.location || profile?.location || "-",
          designation: r.designation || candidateInfo?.designation || profile?.designation || "-",
          obtained: 0, total: 0, count: 0,
        };
      }
      map[key].obtained += r.obtained_marks;
      map[key].total += r.total_marks;
      map[key].count += 1;
    });

    return Object.entries(map).map(([user_id, d]) => ({
      user_id,
      full_name: d.full_name,
      hrms_id: d.hrms_id,
      cug_number: d.cug_number,
      location: d.location,
      designation: d.designation,
      totalExams: d.count,
      totalObtained: d.obtained,
      totalMarks: d.total,
      avgPercent: d.total > 0 ? Math.round((d.obtained / d.total) * 100) : 0,
      passed: d.total > 0 ? (d.obtained / d.total) >= 0.6 : false,
    }));
  }, [results, profiles]);

  // Users who haven't attempted any exam
  const notAttempted = useMemo(() => {
    const attemptedIds = new Set(results.map(r => r.user_id));
    return profiles.filter(p => !attemptedIds.has(p.user_id));
  }, [results, profiles]);

  // Filter logic
  const filtered = useMemo(() => {
    let data = userPerformance;
    if (filterTI !== "all") {
      const loc = admins.find(a => a.admin_name === filterTI)?.location;
      if (loc) data = data.filter(u => u.location === loc);
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      data = data.filter(u => [u.full_name, u.hrms_id, u.cug_number, u.location, u.designation].join(" ").toLowerCase().includes(s));
    }
    return data;
  }, [userPerformance, filterTI, searchTerm, admins]);

  const bestPerformers = [...filtered].sort((a, b) => b.avgPercent - a.avgPercent).slice(0, 10);
  const lowPerformers = [...filtered].sort((a, b) => a.avgPercent - b.avgPercent).filter(u => u.avgPercent < 60).slice(0, 10);

  // TI-wise aggregated data
  const tiData = useMemo(() => {
    const map: Record<string, { users: number; totalScore: number; passed: number; failed: number; count: number }> = {};
    userPerformance.forEach(u => {
      const ti = tiLocations[u.location] || u.location;
      if (!map[ti]) map[ti] = { users: 0, totalScore: 0, passed: 0, failed: 0, count: 0 };
      map[ti].users += 1;
      map[ti].totalScore += u.avgPercent;
      map[ti].count += 1;
      if (u.passed) map[ti].passed += 1;
      else map[ti].failed += 1;
    });
    return Object.entries(map).map(([name, d]) => ({
      name,
      users: d.users,
      avgScore: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
      pass: d.passed,
      fail: d.failed,
    }));
  }, [userPerformance, tiLocations]);

  // Pass/Fail distribution
  const passFailData = useMemo(() => {
    const passed = userPerformance.filter(u => u.passed).length;
    const failed = userPerformance.filter(u => !u.passed).length;
    const notAtt = notAttempted.length;
    return [
      { name: "Passed", value: passed },
      { name: "Failed", value: failed },
      { name: "Not Attempted", value: notAtt },
    ];
  }, [userPerformance, notAttempted]);

  // Exam-wise scores for radar
  const examWiseScores = useMemo(() => {
    const map: Record<string, { title: string; total: number; obtained: number; count: number }> = {};
    results.forEach(r => {
      const title = (r.exams as any)?.title || r.exam_id;
      if (!map[r.exam_id]) map[r.exam_id] = { title, total: 0, obtained: 0, count: 0 };
      map[r.exam_id].total += r.total_marks;
      map[r.exam_id].obtained += r.obtained_marks;
      map[r.exam_id].count += 1;
    });
    return Object.values(map).map(d => ({
      subject: d.title.length > 15 ? d.title.slice(0, 15) + "…" : d.title,
      score: d.total > 0 ? Math.round((d.obtained / d.total) * 100) : 0,
      fullMark: 100,
    }));
  }, [results]);

  const totalAvg = userPerformance.length > 0 ? Math.round(userPerformance.reduce((s, u) => s + u.avgPercent, 0) / userPerformance.length) : 0;

  const filteredNotAttempted = useMemo(() => {
    let data = notAttempted;
    if (filterTI !== "all") {
      const loc = admins.find(a => a.admin_name === filterTI)?.location;
      if (loc) data = data.filter(u => u.location === loc);
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      data = data.filter((u: any) => [u.full_name, u.hrms_id, u.cug_number, u.location, u.designation].join(" ").toLowerCase().includes(s));
    }
    return data;
  }, [notAttempted, filterTI, searchTerm, admins]);

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">{t("loadingAnalytics")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t("reportsTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("reportsDesc")}</p>
        </div>
        <Button variant="outline" onClick={() => {
          const csv = ["Name,HRMS ID,CUG Number,Location,Designation,Exams,Avg%,Status",
            ...userPerformance.map(u => `${u.full_name || u.hrms_id || "Unknown"},${u.hrms_id},${u.cug_number},${u.location},${u.designation},${u.totalExams},${u.avgPercent}%,${u.passed ? "Pass" : "Fail"}`)
          ].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "performance_report.csv";
          a.click();
        }}>
          <Download className="w-4 h-4 mr-2" /> {t("exportCsv")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("searchByNameHrms")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterTI} onValueChange={setFilterTI}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by TI" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTIs")}</SelectItem>
            {admins.map(a => (
              <SelectItem key={a.id} value={a.admin_name}>{a.admin_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t("avgScore")} value={`${totalAvg}%`} icon={<TrendingUp className="w-5 h-5" />} />
        <StatsCard title={t("usersAssessed")} value={userPerformance.length} icon={<Target className="w-5 h-5" />} />
        <StatsCard title={t("notAttempted")} value={notAttempted.length} icon={<Users className="w-5 h-5" />} />
        <StatsCard title={t("lowPerformers")} value={userPerformance.filter(u => u.avgPercent < 60).length} icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      <Tabs defaultValue="performers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performers">{t("performers")}</TabsTrigger>
          <TabsTrigger value="not-attempted">{t("notAttempted")}</TabsTrigger>
          <TabsTrigger value="tiwise">{t("tiWise")}</TabsTrigger>
          <TabsTrigger value="charts">{t("charts")}</TabsTrigger>
        </TabsList>

        {/* Best & Low Performers */}
        <TabsContent value="performers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base text-green-700">🏆 {t("bestPerformers")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("hrmsId")}</TableHead>
                      <TableHead>{t("cugNumber")}</TableHead>
                      <TableHead>{t("location")}</TableHead>
                      <TableHead>{t("examsCount")}</TableHead>
                      <TableHead>{lang === "hi" ? "औसत %" : "Avg %"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bestPerformers.map((u, i) => (
                      <TableRow key={u.user_id}>
                        <TableCell><span className="w-6 h-6 rounded-full bg-railway-gold/10 text-railway-gold flex items-center justify-center text-xs font-bold">{i + 1}</span></TableCell>
                        <TableCell className="font-medium">{u.full_name || u.hrms_id || "Unknown"}</TableCell>
                        <TableCell><Badge variant="outline">{u.hrms_id}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{u.cug_number}</Badge></TableCell>
                        <TableCell className="text-sm">{u.location}</TableCell>
                        <TableCell>{u.totalExams}</TableCell>
                        <TableCell><span className="font-bold text-green-600">{u.avgPercent}%</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base text-destructive">⚠️ {t("lowPerformersBelow60")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("hrmsId")}</TableHead>
                      <TableHead>{t("cugNumber")}</TableHead>
                      <TableHead>{t("location")}</TableHead>
                      <TableHead>{t("examsCount")}</TableHead>
                      <TableHead>{lang === "hi" ? "औसत %" : "Avg %"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowPerformers.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">{t("noLowPerformers")}</TableCell></TableRow>
                    ) : lowPerformers.map((u, i) => (
                      <TableRow key={u.user_id}>
                        <TableCell><span className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold">{i + 1}</span></TableCell>
                        <TableCell className="font-medium">{u.full_name || u.hrms_id || "Unknown"}</TableCell>
                        <TableCell><Badge variant="outline">{u.hrms_id}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{u.cug_number}</Badge></TableCell>
                        <TableCell className="text-sm">{u.location}</TableCell>
                        <TableCell>{u.totalExams}</TableCell>
                        <TableCell><span className="font-bold text-destructive">{u.avgPercent}%</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Full user table */}
          <Card>
            <CardHeader><CardTitle className="text-base">📋 {t("allUserResults")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("hrmsId")}</TableHead>
                    <TableHead>{t("cugNumber")}</TableHead>
                    <TableHead>{t("locationTI")}</TableHead>
                    <TableHead>{t("designation")}</TableHead>
                    <TableHead>{t("examsCount")}</TableHead>
                    <TableHead>{t("score")}</TableHead>
                    <TableHead>{lang === "hi" ? "औसत %" : "Avg %"}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.full_name || u.hrms_id || "Unknown"}</TableCell>
                      <TableCell><Badge variant="outline">{u.hrms_id}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{u.cug_number}</Badge></TableCell>
                      <TableCell>{u.location} <span className="text-xs text-muted-foreground">({tiLocations[u.location] || "-"})</span></TableCell>
                      <TableCell className="text-sm">{u.designation}</TableCell>
                      <TableCell>{u.totalExams}</TableCell>
                      <TableCell>{u.totalObtained}/{u.totalMarks}</TableCell>
                      <TableCell className={`font-bold ${u.avgPercent >= 60 ? "text-green-600" : "text-destructive"}`}>{u.avgPercent}%</TableCell>
                      <TableCell><Badge variant={u.passed ? "default" : "destructive"}>{u.passed ? t("pass") : t("fail")}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Not Attempted */}
        <TabsContent value="not-attempted">
          <Card>
            <CardHeader><CardTitle className="text-base">🚫 {t("usersNotAttempted")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("hrmsId")}</TableHead>
                    <TableHead>{t("cugNumber")}</TableHead>
                    <TableHead>{t("locationTI")}</TableHead>
                    <TableHead>{t("designation")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotAttempted.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("allAttempted")}</TableCell></TableRow>
                  ) : filteredNotAttempted.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || u.username || u.hrms_id || "Unknown"}</TableCell>
                      <TableCell><Badge variant="outline">{u.hrms_id || "-"}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{u.cug_number || "-"}</Badge></TableCell>
                      <TableCell>{u.location || "-"} <span className="text-xs text-muted-foreground">({tiLocations[u.location] || "-"})</span></TableCell>
                      <TableCell className="text-sm">{u.designation || "-"}</TableCell>
                      <TableCell><Badge variant="secondary">{t("notAttempted")}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TI-wise */}
        <TabsContent value="tiwise" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("tiAvgScore")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tiData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={12} domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" fontSize={12} width={70} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="hsl(220, 60%, 22%)" radius={[0, 4, 4, 0]} name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{t("tiPassVsFail")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tiData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pass" stackId="a" fill="hsl(152, 60%, 40%)" name="Passed" />
                    <Bar dataKey="fail" stackId="a" fill="hsl(0, 78%, 42%)" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          {/* TI detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiData.map(ti => (
              <Card key={ti.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg">{ti.name}</p>
                      <p className="text-xs text-muted-foreground">{ti.users} {t("usersAssessedCount")}</p>
                    </div>
                    <span className={`text-2xl font-bold ${ti.avgScore >= 60 ? "text-green-600" : "text-destructive"}`}>{ti.avgScore}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-railway-navy rounded-full transition-all" style={{ width: `${ti.avgScore}%` }} />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="text-green-600">✓ {ti.pass} {t("passed")}</span>
                    <span className="text-destructive">✗ {ti.fail} {lang === "hi" ? "अनुत्तीर्ण" : "failed"}</span>
                    <span>{t("passRate")}: {ti.users > 0 ? Math.round((ti.pass / ti.users) * 100) : 0}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Charts */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("passFailNotAttempted")}</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPie>
                    <Pie data={passFailData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {passFailData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{t("examWiseProf")}</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={examWiseScores}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                    <Radar name="Avg Score" dataKey="score" stroke="hsl(220, 60%, 22%)" fill="hsl(220, 60%, 22%)" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
