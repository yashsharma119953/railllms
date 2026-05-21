import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User, Save, KeyRound, Shield, MapPin, Phone, Briefcase, Hash, Eye, EyeOff, Lock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user, profile, role } = useAuth();
  const { t, lang } = useLanguage();
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    hrms_id: profile?.hrms_id || "",
    cug_number: profile?.cug_number || "",
    designation: profile?.designation || "",
    location: profile?.location || "",
  });
  const [saving, setSaving] = useState(false);

  // Password reset state
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [changingPwd, setChangingPwd] = useState(false);

  const roleLabel = role === "super_admin" ? t("roleSuperAdmin") : role === "admin" ? t("roleAdmin") : t("roleEmployee");
  const roleColor = role === "super_admin" ? "bg-railway-red/10 text-railway-red border-railway-red/20"
    : role === "admin" ? "bg-railway-gold/10 text-railway-gold border-railway-gold/20"
    : "bg-railway-navy/10 text-railway-navy border-railway-navy/20";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.hrms_id.trim()) {
      toast.error("HRMS ID is required!");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name,
        hrms_id: form.hrms_id,
        cug_number: form.cug_number,
        designation: form.designation,
        location: form.location,
      }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match!");
      return;
    }
    setChangingPwd(true);
    try {
      if (!user) throw new Error("Not authenticated");
      if (!role) throw new Error("Role not found");

      const accountUsername = profile?.username || user.username;
      if (!accountUsername) throw new Error("Username not found for this account");

      const { error } = await supabase.rpc("change_account_password", {
        p_role: role,
        p_username: accountUsername,
        p_current_password: passwords.current,
        p_new_password: passwords.new,
      });

      if (error) throw error;

      toast.success("Password changed successfully!");
      setPasswordOpen(false);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t("myProfile")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("manageAccount")}</p>
      </div>

      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="h-20 gradient-navy" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
              <AvatarFallback className="bg-railway-gold text-railway-gold-foreground text-2xl font-bold">
                {form.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-heading font-bold">{form.full_name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge className={`${roleColor} border text-xs`}>
              <Shield className="w-3 h-3 mr-1" />
              {roleLabel}
            </Badge>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { icon: Hash, label: t("hrmsId"), value: form.hrms_id || "—" },
              { icon: Phone, label: t("cugNumber"), value: form.cug_number || "—" },
              { icon: MapPin, label: t("location"), value: form.location || "—" },
              { icon: Briefcase, label: t("designation"), value: form.designation || "—" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <item.icon className="w-3 h-3" />
                  <span className="text-xs">{item.label}</span>
                </div>
                <p className="text-sm font-medium truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-railway-gold" /> {t("editInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("fullName")}</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("hrmsId")} <span className="text-destructive">*</span></Label>
                <Input value={form.hrms_id} onChange={(e) => setForm({ ...form, hrms_id: e.target.value })} placeholder={t("required")} required />
              </div>
              <div className="space-y-2">
                <Label>{t("cugNumber")}</Label>
                <Input value={form.cug_number} onChange={(e) => setForm({ ...form, cug_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("designation")}</Label>
                <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("location")}</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="bg-railway-navy hover:bg-railway-navy-light text-primary-foreground">
              <Save className="w-4 h-4 mr-2" />
              {saving ? t("saving") : t("save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-railway-gold" /> {t("security")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium">{t("changePassword")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("updateAccountPwd")}</p>
            </div>
            <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <KeyRound className="w-4 h-4 mr-2" /> {t("changePassword")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("changePassword")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {[
                    { key: "current" as const, label: t("currentPassword"), placeholder: lang === "hi" ? "वर्तमान पासवर्ड दर्ज करें" : "Enter current password" },
                    { key: "new" as const, label: t("newPassword"), placeholder: lang === "hi" ? "कम से कम 6 अक्षर" : "Min 6 characters" },
                    { key: "confirm" as const, label: t("confirmPassword"), placeholder: lang === "hi" ? "नया पासवर्ड पुनः दर्ज करें" : "Re-enter new password" },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      <div className="relative">
                        <Input
                          type={showPwd[field.key] ? "text" : "password"}
                          placeholder={field.placeholder}
                          value={passwords[field.key]}
                          onChange={(e) => setPasswords(p => ({ ...p, [field.key]: e.target.value }))}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPwd(p => ({ ...p, [field.key]: !p[field.key] }))}
                        >
                          {showPwd[field.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="submit" className="w-full" disabled={changingPwd}>
                    {changingPwd ? t("changingPwd") : t("updatePassword")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium">{t("role")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("currentRole")}</p>
            </div>
            <Badge className={`${roleColor} border`}>{roleLabel}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
