import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy } from "lucide-react";

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailQuestions, setDetailQuestions] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const { user, role } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchResults() {
      let query = supabase.from("exam_results").select("*, exams(title)");
      if (role === "user") {
        query = query.eq("user_id", user?.id);
      }
      const { data } = await query.order("submitted_at", { ascending: false });
      if (data) setResults(data);
    }
    if (user) fetchResults();
  }, [user, role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">
          {role === "user" ? `📊 ${t("myResults")}` : t("viewResults")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {role === "user" ? t("yourPerfHistory") : t("reviewResults")}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("exam")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("score")}</TableHead>
                <TableHead>{t("percentage")}</TableHead>
                <TableHead>{t("hrmsId")}</TableHead>
                <TableHead>{t("cugNumber")}</TableHead>
                <TableHead>{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {t("noResultsYetTable")}
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => {
                  const pct = Math.round((result.obtained_marks / result.total_marks) * 100);
                  const candidateInfo = result.answers?.candidate_info;
                  return (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.exams?.title || t("exam")}</TableCell>
                      <TableCell className="text-sm">{result.full_name || candidateInfo?.full_name || result.user_name || result.hrms_id}</TableCell>
                      <TableCell>{result.obtained_marks}/{result.total_marks}</TableCell>
                      <TableCell>
                        <Badge variant={pct >= 60 ? "default" : "destructive"}>
                          {pct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{result.hrms_id || candidateInfo?.hrms_id}</TableCell>
                      <TableCell className="text-sm">{result.cug_number || candidateInfo?.cug_number || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(result.submitted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={async () => {
                          setSelectedResult(result);
                          const { data } = await supabase.from("questions").select("*").eq("exam_id", result.exam_id).order("sort_order");
                          setDetailQuestions(data || []);
                          setDetailsOpen(true);
                        }}>View</Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedResult?.exams?.title || t("examDetails")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {detailQuestions.map((q, idx) => {
              const userAns = selectedResult?.answers?.[q.id];
              return (
                <div key={q.id} className="p-4 border rounded-lg">
                  <p className="font-medium">Q{idx + 1}. {q.question_text}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {[{k:'A',t:q.option_a},{k:'B',t:q.option_b},{k:'C',t:q.option_c},{k:'D',t:q.option_d}].map(opt => (
                      <div key={opt.k} className={`p-3 rounded-lg border text-sm ${opt.k === q.correct_option ? "border-railway-green bg-railway-green/10 font-medium" : "border-border"} ${opt.k === userAns ? "ring-2 ring-offset-1 ring-railway-navy" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium mr-1">{opt.k}.</span>
                          <span>{opt.t}</span>
                          {opt.k === q.correct_option && <span className="ml-auto text-railway-green text-xs">{t("correct")}</span>}
                          {opt.k === userAns && <span className="ml-2 text-railway-navy text-xs">{t("yourAnswer")}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
