import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ClipboardList, Upload, Trash2, Eye, FileUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Question {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
}

const emptyQ = (): Question => ({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A", marks: 1 });

export default function ExamManagement() {
  const [exams, setExams] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", duration: "30" });
  const [questions, setQuestions] = useState<Question[]>([emptyQ()]);
  const [csvQuestions, setCsvQuestions] = useState<Question[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"manual" | "csv">("manual");
  const { user } = useAuth();

  const fetchExams = async () => {
    const { data } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
    if (data) setExams(data);
  };

  useEffect(() => { fetchExams(); }, []);

  const addQuestion = () => setQuestions(prev => [...prev, emptyQ()]);
  const updateQuestion = (idx: number, field: keyof Question, value: string | number) =>
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const parseCsvFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const header = lines[0].toLowerCase();
    const startIdx = header.includes("question") ? 1 : 0;
    const parsed: Question[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      // Support both comma and tab delimited
      const cols = lines[i].includes("\t")
        ? lines[i].split("\t").map(c => c.trim())
        : lines[i].split(",").map(c => c.trim());
      if (cols.length < 6) continue;
      parsed.push({
        question_text: cols[0],
        option_a: cols[1],
        option_b: cols[2],
        option_c: cols[3],
        option_d: cols[4],
        correct_option: (cols[5] || "A").toUpperCase(),
        marks: parseInt(cols[6]) || 1,
      });
    }
    return parsed;
  };

  const handleCsvFileChange = async (file: File | null) => {
    setCsvFile(file);
    if (file) {
      try {
        const parsed = await parseCsvFile(file);
        setCsvQuestions(parsed);
        toast.success(`Parsed ${parsed.length} questions from CSV`);
      } catch {
        toast.error("Failed to parse CSV");
        setCsvQuestions([]);
      }
    } else {
      setCsvQuestions([]);
    }
  };

  const getActiveQuestions = (): Question[] => {
    if (inputMode === "csv") return csvQuestions;
    return questions;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const validQs = getActiveQuestions().filter(q => q.question_text.trim());
    if (validQs.length === 0) { toast.error("Add at least one question"); return; }

    setLoading(true);
    try {
      const { data: examData, error } = await supabase.from("exams").insert({
        title: form.title,
        description: form.description,
        duration_minutes: parseInt(form.duration),
        created_by: null,
        is_active: true,
      }).select().single();
      if (error) throw error;

      const questionRows = validQs.map((q, i) => ({
        exam_id: examData.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        marks: q.marks,
        sort_order: i + 1,
      }));

      const { error: qError } = await supabase.from("questions").insert(questionRows);
      if (qError) throw qError;

      toast.success(`Exam created with ${validQs.length} MCQs!`);
      setOpen(false);
      setForm({ title: "", description: "", duration: "30" });
      setQuestions([emptyQ()]);
      setCsvQuestions([]);
      setCsvFile(null);
      setInputMode("manual");
      fetchExams();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewQuestions = async (exam: any) => {
    setSelectedExam(exam);
    const { data } = await supabase.from("questions").select("*").eq("exam_id", exam.id).order("sort_order");
    setExamQuestions(data || []);
    setQuestionsOpen(true);
  };

  const totalQs = getActiveQuestions().filter(q => q.question_text.trim()).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Exam Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Create MCQ assessments for users</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-railway-navy hover:bg-railway-navy-light text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create MCQ Exam</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exam Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} min="5" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Question Input Mode Tabs */}
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="manual" className="flex-1">Manual Entry</TabsTrigger>
                  <TabsTrigger value="csv" className="flex-1">
                    <FileUp className="w-3 h-3 mr-1" /> Upload CSV
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">MCQ Questions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                      <Plus className="w-3 h-3 mr-1" /> Add Question
                    </Button>
                  </div>
                  {questions.map((q, idx) => (
                    <Card key={idx} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Q{idx + 1}</span>
                        {questions.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeQuestion(idx)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <Input placeholder="Question text" value={q.question_text} onChange={(e) => updateQuestion(idx, "question_text", e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Option A" value={q.option_a} onChange={(e) => updateQuestion(idx, "option_a", e.target.value)} />
                        <Input placeholder="Option B" value={q.option_b} onChange={(e) => updateQuestion(idx, "option_b", e.target.value)} />
                        <Input placeholder="Option C" value={q.option_c} onChange={(e) => updateQuestion(idx, "option_c", e.target.value)} />
                        <Input placeholder="Option D" value={q.option_d} onChange={(e) => updateQuestion(idx, "option_d", e.target.value)} />
                      </div>
                      <div className="flex gap-3">
                        <div className="space-y-1 flex-1">
                          <Label className="text-xs">Correct Answer</Label>
                          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={q.correct_option} onChange={(e) => updateQuestion(idx, "correct_option", e.target.value)}>
                            <option value="A">A</option><option value="B">B</option>
                            <option value="C">C</option><option value="D">D</option>
                          </select>
                        </div>
                        <div className="space-y-1 w-20">
                          <Label className="text-xs">Marks</Label>
                          <Input type="number" min="1" value={q.marks} onChange={(e) => updateQuestion(idx, "marks", parseInt(e.target.value) || 1)} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="csv" className="space-y-4 mt-4">
                  <div className="p-4 rounded-lg border border-dashed border-border bg-muted/30 space-y-3">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Upload CSV with MCQ Questions</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: <code className="bg-muted px-1 rounded">Question, Option A, Option B, Option C, Option D, Correct (A/B/C/D), Marks</code>
                      </p>
                    </div>
                    <Input type="file" accept=".csv,.tsv,.txt" onChange={(e) => handleCsvFileChange(e.target.files?.[0] || null)} />
                  </div>

                  {csvQuestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-railway-green">✓ {csvQuestions.length} questions parsed</p>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {csvQuestions.map((q, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/40 text-sm">
                            <p className="font-medium">Q{i + 1}. {q.question_text}</p>
                            <div className="grid grid-cols-2 gap-1 mt-1 text-xs text-muted-foreground">
                              <span>A: {q.option_a}</span>
                              <span>B: {q.option_b}</span>
                              <span>C: {q.option_c}</span>
                              <span>D: {q.option_d}</span>
                            </div>
                            <p className="text-xs mt-1">Correct: <Badge variant="outline" className="text-xs">{q.correct_option}</Badge> • {q.marks} mark(s)</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full" disabled={loading || totalQs === 0}>
                {loading ? "Creating..." : `Create Exam with ${totalQs} MCQs`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No exams yet.
                  </TableCell>
                </TableRow>
              ) : exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.duration_minutes} min</TableCell>
                  <TableCell>
                    <Badge variant={exam.is_active ? "default" : "secondary"}>
                      {exam.is_active ? "Active" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(exam.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewQuestions(exam)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={questionsOpen} onOpenChange={setQuestionsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Questions — {selectedExam?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {examQuestions.map((q, i) => (
              <Card key={q.id} className="p-4">
                <p className="text-sm font-medium mb-2">Q{i + 1}. {q.question_text} <span className="text-muted-foreground">({q.marks} mark{q.marks > 1 ? "s" : ""})</span></p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {["A", "B", "C", "D"].map(opt => (
                    <span key={opt} className={`px-2 py-1 rounded ${q.correct_option === opt ? "bg-railway-green/10 text-railway-green font-medium" : "text-muted-foreground"}`}>
                      {opt}. {q[`option_${opt.toLowerCase()}`]}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
