import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t("welcomeUser")}, {profile?.full_name || "User"}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("accessLearning")}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-railway-navy/30 group"
          onClick={() => navigate("/dashboard/learning")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-railway-navy/10 flex items-center justify-center group-hover:bg-railway-navy/20 transition-colors">
              <BookOpen className="w-8 h-8 text-railway-navy" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold">📚 {t("learningMaterialsTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("learningMaterialsDesc")}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-railway-gold/30 group"
          onClick={() => navigate("/dashboard/exams-page")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-railway-gold/10 flex items-center justify-center group-hover:bg-railway-gold/20 transition-colors">
              <ClipboardList className="w-8 h-8 text-railway-gold" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold">📝 {t("examsTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("examsDesc")}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
