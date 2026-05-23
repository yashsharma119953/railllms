import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
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
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
