import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Users, Plus, Eye, EyeOff, Copy, Upload } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string | null;
  hrms_id: string | null;
  cug_number: string | null;
  location: string | null;
  designation: string | null;
  is_active: boolean;
}

interface CreatedUser {
  name: string;
  username: string;
  password: string;
}

const generatePassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "" });
  const [loading, setLoading] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { role, profile } = useAuth();

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const password = generatePassword();
      const username = form.username.trim();
      if (!username) throw new Error("Username is required");
      const userId = crypto.randomUUID();

      const { error } = await supabase.from("profiles").insert({
        user_id: userId,
        full_name: username,
        username,
        password,
        hrms_id: null,
        designation: null,
        location: profile?.location || null,
        cug_number: null,
      });
      if (error) throw error;

      setCreatedUsers(prev => [...prev, { name: username, username, password }]);
      toast.success(`User "${username}" created successfully!`);
      setForm({ username: "" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setLoading(true);
    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter(l => l.trim());
      const newUsers: CreatedUser[] = [];

      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        if (!cols[0]) continue;
        const username = cols[0];
        const password = generatePassword();
        const userId = crypto.randomUUID();

        const { error } = await supabase.from("profiles").insert({
          user_id: userId,
          full_name: username,
          username,
          password,
          hrms_id: null,
          designation: null,
          location: profile?.location || null,
          cug_number: null,
        });
        if (error) throw error;
        newUsers.push({ name: username, username, password });
      }

      setCreatedUsers(prev => [...prev, ...newUsers]);
      toast.success(`${newUsers.length} users created from CSV!`);
      setCsvFile(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name || u.username || "").toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            {role === "super_admin" ? "All Users" : "User Management"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {role === "super_admin" ? "View all users across the division" : "Create and manage your assigned users"}
          </p>
        </div>
        {(role === "admin" || role === "super_admin") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-railway-navy hover:bg-railway-navy-light text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create User ID</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ username: e.target.value })} placeholder="e.g., user_001" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create User"}
                </Button>
              </form>

              <div className="border-t pt-4 mt-2">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4" /> Bulk Upload via CSV
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  CSV format: Username (one per line)
                </p>
                <div className="flex gap-2">
                  <Input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                  <Button variant="outline" onClick={handleCsvUpload} disabled={!csvFile || loading}>
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {createdUsers.length > 0 && (
        <Card className="border-railway-gold/30 bg-railway-gold/5">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">🔑 Generated Passwords</h3>
            <div className="space-y-2">
              {createdUsers.map((u, idx) => (
                <div key={idx} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border">
                  <div>
                    <span className="font-medium text-sm">{u.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{u.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {showPasswords[idx] ? u.password : "••••••••••"}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPasswords(prev => ({ ...prev, [idx]: !prev[idx] }))}>
                      {showPasswords[idx] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(u.password); toast.success("Password copied!"); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or HRMS ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>HRMS ID</TableHead>
                <TableHead>CUG Number</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.hrms_id || "-"}</TableCell>
                    <TableCell>{user.cug_number || "-"}</TableCell>
                    <TableCell>{user.location || "-"}</TableCell>
                    <TableCell>{user.designation || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
