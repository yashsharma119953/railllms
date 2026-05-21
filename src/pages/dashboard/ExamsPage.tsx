import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ClipboardList, Clock, Play, CheckCircle, XCircle } from "lucide-react";

interface ExamRegForm {
  name: string;
  station: string;
  hrmsId: string;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [regOpen, setRegOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [regForm, setRegForm] = useState<ExamRegForm>({ name: "", station: "", hrmsId: "" });
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ obtained: number; total: number } | null>(null);
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  useEffect(() => {
    async function fetchExams() {
      const { data } = await supabase.from("exams").select("*").eq("is_active", true);
      if (data) setExams(data);
    }
    fetchExams();
  }, []);

  const handleStartExam = (exam: any) => {
    setSelectedExam(exam);
    setRegForm({ name: "", station: "", hrmsId: "" });
    setRegOpen(true);
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    const { data } = await supabase.from("questions").select("*").eq("exam_id", selectedExam.id).order("sort_order");
    setQuestions(data || []);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setRegOpen(false);
    setExamOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !selectedExam) return;
    let obtained = 0;
    let total = 0;
    questions.forEach(q => {
      total += q.marks;
      if (answers[q.id] === q.correct_option) obtained += q.marks;
    });

    try {
      const demoUserId = crypto.randomUUID();
      const { error } = await supabase.from("exam_results").insert({
        exam_id: selectedExam.id,
        user_id: demoUserId,
        hrms_id: regForm.hrmsId,
        obtained_marks: obtained,
        total_marks: total,
        answers: answers as any,
      });
      if (error) throw error;
      setResult({ obtained, total });
      setSubmitted(true);
      toast.success(lang === "hi" ? "परीक्षा जमा हो गई!" : "Exam submitted!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">📝 {t("examPageTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("examPageDesc")}</p>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t("noExamsAvailable")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-railway-navy/10 flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-railway-navy" />
                    </div>
                    <div>
                      <h3 className="font-medium">{exam.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {exam.duration_minutes} {lang === "hi" ? "मिनट" : "min"}
                        </span>
                        {exam.deadline && (
                          <span>{lang === "hi" ? "अंतिम तिथि" : "Deadline"}: {new Date(exam.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button className="bg-railway-green hover:bg-railway-green/90 text-white" onClick={() => handleStartExam(exam)}>
                    <Play className="w-4 h-4 mr-2" /> {t("startExam")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={regOpen} onOpenChange={setRegOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("fillDetails")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("fullName")}</Label>
              <Input placeholder={t("yourFullName")} value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("station")}</Label>
              <Input placeholder="e.g., SKB, PYG, ALD" value={regForm.station} onChange={(e) => setRegForm({ ...regForm, station: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("hrmsId")}</Label>
              <Input placeholder={lang === "hi" ? "आपकी HRMS आईडी" : "Your HRMS ID"} value={regForm.hrmsId} onChange={(e) => setRegForm({ ...regForm, hrmsId: e.target.value })} required />
            </div>
            <p className="text-xs text-muted-foreground">{t("exam")}: {selectedExam?.title}</p>
            <Button type="submit" className="w-full bg-railway-navy hover:bg-railway-navy-light text-white">
              {t("proceedExam")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={examOpen} onOpenChange={setExamOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.title}</DialogTitle>
            {!submitted && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("candidate")}: {regForm.name} | {t("station")}: {regForm.station} | HRMS: {regForm.hrmsId}
              </p>
            )}
          </DialogHeader>

          {submitted && result ? (
            <div className="text-center py-8 space-y-4">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${result.obtained / result.total >= 0.6 ? "bg-railway-green/10" : "bg-destructive/10"}`}>
                {result.obtained / result.total >= 0.6 ? (
                  <CheckCircle className="w-10 h-10 text-railway-green" />
                ) : (
                  <XCircle className="w-10 h-10 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-3xl font-bold">{result.obtained}/{result.total}</p>
                <p className="text-muted-foreground">({Math.round((result.obtained / result.total) * 100)}%)</p>
              </div>
              <Badge variant={result.obtained / result.total >= 0.6 ? "default" : "destructive"} className="text-base px-4 py-1">
                {result.obtained / result.total >= 0.6 ? t("passedResult") : t("failedResult")}
              </Badge>
              <p className="text-sm text-muted-foreground">{regForm.name} — {regForm.station} — {regForm.hrmsId}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <p className="text-sm font-medium">
                    {lang === "hi" ? "प्र" : "Q"}{idx + 1}. {q.question_text}
                    <span className="text-muted-foreground ml-2">({q.marks} {q.marks > 1 ? t("marks") : t("mark")})</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map(opt => (
                      <button key={opt} type="button"
                        className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                          answers[q.id] === opt
                            ? "border-railway-navy bg-railway-navy/10 font-medium"
                            : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      >
                        <span className="font-medium mr-2">{opt}.</span>
                        {q[`option_${opt.toLowerCase()}`]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={handleSubmit} className="w-full bg-railway-navy hover:bg-railway-navy-light text-white" disabled={Object.keys(answers).length === 0}>
                {t("submitExam")} ({Object.keys(answers).length}/{questions.length} {t("answered")})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
