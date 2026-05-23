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
  fullName: string;
  hrmsId: string;
  cugNumber: string;
  designation: string;
  location: string;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [regOpen, setRegOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [regForm, setRegForm] = useState<ExamRegForm>({ fullName: "", hrmsId: "", cugNumber: "", designation: "", location: "" });
  const [candidateInfoState, setCandidateInfoState] = useState<Record<string, any> | null>(null);
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
    setRegForm({ fullName: "", hrmsId: "", cugNumber: "", designation: "", location: "" });
    setRegOpen(true);
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    const candidateInfo = {
      full_name: regForm.fullName.trim(),
      hrms_id: regForm.hrmsId.trim(),
      cug_number: regForm.cugNumber.trim(),
      designation: regForm.designation.trim(),
      location: regForm.location.trim(),
    };

    setCandidateInfoState(candidateInfo);

    const checkDuplicateAttempt = async () => {
      const { data, error } = await supabase
        .from("exam_results")
        .select("id, user_id, hrms_id, cug_number, answers")
        .eq("exam_id", selectedExam.id);

      if (error) throw error;

      const normalizedHrms = candidateInfo.hrms_id.toLowerCase();
      const normalizedCug = candidateInfo.cug_number.toLowerCase();

      return (data || []).find((row: any) => {
        const rowHrms = (row.hrms_id || row.answers?.candidate_info?.hrms_id || "").toString().trim().toLowerCase();
        const rowCug = (row.cug_number || row.answers?.candidate_info?.cug_number || "").toString().trim().toLowerCase();
        return rowHrms === normalizedHrms && rowCug === normalizedCug;
      });
    };

    try {
      const existingAttempt = await checkDuplicateAttempt();
      if (existingAttempt) {
        toast.error("You have already attempted this exam");
        return;
      }
    } catch (err: any) {
      toast.error(err.message);
      return;
    }

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
      const candidateInfoToSave = candidateInfoState ?? {
        full_name: regForm.fullName.trim(),
        hrms_id: regForm.hrmsId.trim(),
        cug_number: regForm.cugNumber.trim(),
        designation: regForm.designation.trim(),
        location: regForm.location.trim(),
      };

      const { error } = await supabase.from("exam_results").insert({
        exam_id: selectedExam.id,
        user_id: user.id,
        hrms_id: regForm.hrmsId.trim(),
        full_name: regForm.fullName.trim(),
        cug_number: regForm.cugNumber.trim(),
        designation: regForm.designation.trim(),
        location: regForm.location.trim(),
        obtained_marks: obtained,
        total_marks: total,
        answers: {
          ...(answers as any),
          candidate_info: candidateInfoToSave,
        } as any,
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
              <Input placeholder={t("yourFullName")} value={regForm.fullName} onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("hrmsId")}</Label>
              <Input placeholder={lang === "hi" ? "आपकी HRMS आईडी" : "Your HRMS ID"} value={regForm.hrmsId} onChange={(e) => setRegForm({ ...regForm, hrmsId: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("cugNumber")}</Label>
              <Input placeholder={lang === "hi" ? "आपका CUG नंबर" : "Your CUG Number"} value={regForm.cugNumber} onChange={(e) => setRegForm({ ...regForm, cugNumber: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("designation")}</Label>
              <Input placeholder={lang === "hi" ? "पदनाम" : "Designation"} value={regForm.designation} onChange={(e) => setRegForm({ ...regForm, designation: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("location")}</Label>
              <Input placeholder={lang === "hi" ? "स्थान" : "Location"} value={regForm.location} onChange={(e) => setRegForm({ ...regForm, location: e.target.value })} required />
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
                {t("candidate")}: {regForm.fullName} | HRMS: {regForm.hrmsId} | CUG: {regForm.cugNumber}
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
              <p className="text-sm text-muted-foreground">
                {regForm.fullName} — {regForm.hrmsId} — {regForm.cugNumber} — {regForm.designation} — {regForm.location}
              </p>
              <div className="mt-6 text-left">
                <h3 className="text-lg font-medium mb-3">{t("reviewAnswers")}</h3>
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const userAns = (answers as any)[q.id];
                    const correct = q.correct_option;
                    return (
                      <div key={q.id} className="p-4 border rounded-lg">
                        <p className="font-medium">{lang === "hi" ? "प्र" : "Q"}{idx + 1}. {q.question_text}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          {[
                            { key: "A", text: q.option_a },
                            { key: "B", text: q.option_b },
                            { key: "C", text: q.option_c },
                            { key: "D", text: q.option_d },
                          ].map(opt => (
                            <div key={opt.key} className={`p-3 rounded-lg border text-sm ${opt.key === correct ? "border-railway-green bg-railway-green/10 font-medium" : "border-border"} ${opt.key === userAns ? "ring-2 ring-offset-1 ring-railway-navy" : ""}`}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium mr-1">{opt.key}.</span>
                                <span>{opt.text}</span>
                                {opt.key === correct && <span className="ml-auto text-railway-green text-xs">{t("correct")}</span>}
                                {opt.key === userAns && <span className="ml-2 text-railway-navy text-xs">{t("yourAnswer")}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
