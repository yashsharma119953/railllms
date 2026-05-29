import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, UserCog, Trash2, Upload, KeyRound, Copy, Eye, EyeOff } from "lucide-react";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

interface Admin {
  id: string;
  admin_name: string;
  admin_username: string | null;
  location: string;
  cug_number: string | null;
  admin_user_id: string;
}

interface CreatedAccount {
  name: string;
  username: string;
  cug: string;
  password: string;
  kind: "admin" | "user";
}

const slugifyName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", cug: "" });
  const [loading, setLoading] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<CreatedAccount[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [revealedAdminPasswords, setRevealedAdminPasswords] = useState<Record<string, string>>({});
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const fetchAdmins = async () => {
    const { data } = await supabase.from("admin_assignments").select("*");
    if (data) setAdmins(data);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const createAdminRecord = async (name: string, username: string, cug: string) => {
    const password = generatePassword();
    const fakeId = crypto.randomUUID();
    const { error } = await supabase.from("admin_assignments").insert({
      admin_user_id: fakeId,
      admin_name: name,
      admin_username: username,
      admin_password: password,
      location: name,
      cug_number: cug,
    });
    if (error) throw error;
    return { name, username, cug, password, kind: "admin" as const };
  };

  const createDefaultUsersForAdmin = async (adminName: string, location: string) => {
    const base = slugifyName(adminName) || "admin";
    const defaultUsers = Array.from({ length: 20 }, (_, index) => {
      const username = `${base}_user-${index + 1}`;
      return {
        user_id: crypto.randomUUID(),
        full_name: username,
        username,
        password: generatePassword(),
        hrms_id: null,
        designation: null,
        location,
        cug_number: null,
        is_active: true,
      };
    });

    const { error } = await supabase.from("profiles").insert(defaultUsers);
    if (error) throw error;

    return defaultUsers.map((user) => ({
      name: user.full_name,
      username: user.username,
      cug: "",
      password: user.password,
      kind: "user" as const,
    }));
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const username = form.username.trim();
      if (!username) throw new Error("Username is required");
      const adminResult = await createAdminRecord(form.name, username, form.cug);
      const userResults = await createDefaultUsersForAdmin(form.name, form.name);
      setCreatedAccounts(prev => [...prev, adminResult, ...userResults]);
      toast.success(`Admin "${form.name}" created with 20 default users.`);
      setOpen(false);
      setForm({ name: "", username: "", cug: "" });
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return;
    setLoading(true);
    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter(l => l.trim());
      const header = lines[0].toLowerCase();
      const startIdx = header.includes("name") ? 1 : 0;
      const results: CreatedAccount[] = [];

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        if (cols.length < 3 || !cols[1]) continue;
        try {
          const result = await createAdminRecord(cols[0], cols[1], cols[2]);
          results.push(result);
        } catch {
          toast.error(`Failed for ${cols[0]}`);
        }
      }

      setCreatedAccounts(prev => [...prev, ...results]);
      toast.success(`${results.length} admins created via CSV!`);
      setBulkOpen(false);
      setCsvFile(null);
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("admin_assignments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Admin removed");
    fetchAdmins();
  };

  const handleRevealPassword = async (id: string, adminName: string) => {
    const { data, error } = await supabase
      .from("admin_assignments")
      .select("admin_password")
      .eq("id", id)
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data?.admin_password) {
      toast.error(`No password is stored for ${adminName}`);
      return;
    }

    setRevealedAdminPasswords(prev => ({ ...prev, [id]: data.admin_password }));
    toast.success(`Password loaded for ${adminName}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const copyAllCredentials = () => {
    const text = createdAccounts
      .map((account) => `${account.kind.toUpperCase()} | ${account.name} | Username: ${account.username} | Password: ${account.password}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("All credentials copied!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Admin Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage TI (Transport Inspectors)</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="w-4 h-4 mr-2" /> Bulk CSV</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Bulk Upload Admins (CSV)</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  CSV format: <code className="bg-muted px-1 rounded">Admin Name, Username, CUG Number</code> (one per line)
                </p>
                <div className="space-y-2">
                  <Label>Select CSV File</Label>
                  <Input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                </div>
                <Button onClick={handleBulkUpload} className="w-full" disabled={!csvFile || loading}>
                  {loading ? "Processing..." : "Upload & Create Admins"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-railway-navy hover:bg-railway-navy-light text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Admin (TI)</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Admin Name</Label>
                  <Input placeholder="e.g., TI_SKB" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input placeholder="e.g., ti_skb@acetians.in" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>CUG Number</Label>
                  <Input placeholder="CUG number" value={form.cug} onChange={(e) => setForm({ ...form, cug: e.target.value })} required />
                </div>
                <p className="text-xs text-muted-foreground">A password will be auto-generated and displayed after creation.</p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Admin"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {createdAccounts.length > 0 && (
        <Card className="border-railway-gold/30 bg-railway-gold/5">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-railway-gold" /> Generated Credentials
              </CardTitle>
              <Button variant="outline" size="sm" onClick={copyAllCredentials}>
                <Copy className="w-4 h-4 mr-2" /> Copy All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              The admin gets one login, and 20 default user accounts are created automatically.
              Usernames follow the pattern <span className="font-medium">admin-name_user-1</span> to <span className="font-medium">admin-name_user-20</span>.
            </p>
            <div className="space-y-2">
              {createdAccounts.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{a.kind}</p>
                    {a.username && <p className="text-xs text-muted-foreground">Username: {a.username}</p>}
                    {a.cug && <p className="text-xs text-muted-foreground">CUG: {a.cug}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {showPasswords[i] ? a.password : "••••••••••"}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPasswords(p => ({ ...p, [i]: !p[i] }))}>
                      {showPasswords[i] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(a.password)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>CUG Number</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <UserCog className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No admins yet. Click "Add Admin" to create one.
                  </TableCell>
                </TableRow>
              ) : admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.admin_name}</TableCell>
                  <TableCell>{admin.admin_username || "-"}</TableCell>
                  <TableCell>{admin.cug_number || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Show Stored Password" onClick={() => handleRevealPassword(admin.id, admin.admin_name)}>
                        <KeyRound className="w-4 h-4 text-railway-gold" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(admin.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {revealedAdminPasswords[admin.id] && (
                      <div className="mt-2 rounded-md border border-railway-gold/30 bg-railway-gold/5 px-2 py-1 text-left">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Stored Password</p>
                        <code className="break-all text-xs font-mono text-foreground">
                          {revealedAdminPasswords[admin.id]}
                        </code>
                      </div>
                    )}
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
