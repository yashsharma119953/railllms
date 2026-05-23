import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Train, Shield, Eye, EyeOff, Languages } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "user" | null>(null);
  const { signIn } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(selectedRole, identifier, password);
      if (error) throw error;
      toast.success(lang === "hi" ? "वापसी पर स्वागत है!" : "Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || (lang === "hi" ? "प्रमाणीकरण विफल" : "Authentication failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-navy relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-railway-gold" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full border border-railway-gold" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-railway-gold" />
      </div>

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLang(lang === "en" ? "hi" : "en")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 text-xs font-medium transition-colors"
        >
          <Languages className="w-3.5 h-3.5" />
          {lang === "en" ? "हिन्दी" : "English"}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 w-full max-w-md px-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-railway-gold mb-4">
            <Train className="w-8 h-8 text-railway-gold-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-primary-foreground">
            {t("loginTitle")}
          </h1>
          <p className="text-sm text-primary-foreground/60 mt-1">
            {t("loginSubtitle")}
          </p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>{t("secureLogin")}</span>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Select role</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-muted-foreground"
                    onClick={() => setSelectedRole(null)}
                    disabled={!selectedRole}
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="loginRole"
                      checked={selectedRole === "user"}
                      onChange={() => setSelectedRole("user")}
                    />
                    User
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="loginRole"
                      checked={selectedRole === "admin"}
                      onChange={() => setSelectedRole("admin")}
                    />
                    Admin
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="identifier">Username</Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={selectedRole ? "Enter username" : "username"}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("enterPassword")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-railway-navy hover:bg-railway-navy-light text-primary-foreground" disabled={isLoading}>
                {isLoading ? t("pleaseWait") : t("signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-primary-foreground/40 mt-6">
          {t("copyright")}
        </p>
      </motion.div>
    </div>
  );
}
