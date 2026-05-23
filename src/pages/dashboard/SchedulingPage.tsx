import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarDays, Clock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function SchedulingPage() {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({ examTitle: "", adminName: "", date: "", startTime: "", endTime: "" });
  const [editForm, setEditForm] = useState({ examTitle: "", adminName: "", date: "", startTime: "", endTime: "" });
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const fetchSchedules = async () => {
    const { data } = await supabase
      .from("exam_schedules")
      .select("*")
      .order("scheduled_date", { ascending: true });
    if (data) setSchedules(data);
  };

  const fetchAdmins = async () => {
    const { data } = await supabase.from("admin_assignments").select("*");
    if (data) setAdmins(data);
  };

  useEffect(() => {
    fetchSchedules();
    fetchAdmins();
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timerId);
  }, []);

  const getStatus = (date: string, startTime: string, endTime: string) => {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "active";
    return "completed";
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.adminName) {
      toast.error("Please select a TI");
      return;
    }
    setLoading(true);
    try {
      const status = getStatus(form.date, form.startTime, form.endTime);
      const { error } = await supabase.from("exam_schedules").insert({
        exam_title: form.examTitle,
        admin_name: form.adminName,
        scheduled_date: form.date,
        start_time: form.startTime,
        end_time: form.endTime,
        status,
      });
      if (error) throw error;
      toast.success(`Schedule created for ${form.adminName}`);
      setOpen(false);
      setForm({ examTitle: "", adminName: "", date: "", startTime: "", endTime: "" });
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (schedule: any) => {
    setEditingScheduleId(schedule.id);
    setEditForm({
      examTitle: schedule.exam_title,
      adminName: schedule.admin_name,
      date: schedule.scheduled_date,
      startTime: schedule.start_time?.slice(0, 5) || "",
      endTime: schedule.end_time?.slice(0, 5) || "",
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheduleId) return;
    if (!editForm.adminName) {
      toast.error("Please select a TI");
      return;
    }

    setLoading(true);
    try {
      const status = getStatus(editForm.date, editForm.startTime, editForm.endTime);
      const { error } = await supabase
        .from("exam_schedules")
        .update({
          exam_title: editForm.examTitle,
          admin_name: editForm.adminName,
          scheduled_date: editForm.date,
          start_time: editForm.startTime,
          end_time: editForm.endTime,
          status,
        })
        .eq("id", editingScheduleId);

      if (error) throw error;

      toast.success("Schedule updated");
      setEditOpen(false);
      setEditingScheduleId(null);
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (schedule: any) => {
    setDeletingSchedule(schedule);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSchedule?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("exam_schedules").delete().eq("id", deletingSchedule.id);
      if (error) throw error;
      toast.success("Schedule deleted");
      setDeleteOpen(false);
      setDeletingSchedule(null);
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-railway-gold/10 text-railway-gold";
    }
  };

  const schedulesWithStatus = schedules.map((schedule) => ({
    ...schedule,
    currentStatus: getStatus(schedule.scheduled_date, schedule.start_time, schedule.end_time),
  }));

  const uniqueTIs = new Set(schedulesWithStatus.map((s) => s.admin_name));

  return (
    <div className="space-y-6">
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule?
              {deletingSchedule ? ` ${deletingSchedule.exam_title} for ${deletingSchedule.admin_name} will be removed permanently.` : " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Scheduling</h1>
          <p className="text-muted-foreground text-sm mt-1">Assign TI-wise exam date & time slots</p>
        </div>
        {(role === "super_admin" || role === "admin") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-railway-navy hover:bg-railway-navy-light text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Exam Schedule</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Exam / Assessment Title</Label>
                  <Input placeholder="e.g., Safety Rules Assessment" value={form.examTitle} onChange={(e) => setForm({ ...form, examTitle: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Assign to TI</Label>
                  <Select value={form.adminName} onValueChange={(v) => setForm({ ...form, adminName: v })}>
                    <SelectTrigger><SelectValue placeholder="Select TI" /></SelectTrigger>
                    <SelectContent>
                      {admins.length > 0 ? (
                        admins.map((a) => (
                          <SelectItem key={a.id} value={a.admin_name}>
                            {a.admin_name} ({a.location})
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="TI_SKB">TI_SKB (Sikohabad)</SelectItem>
                          <SelectItem value="TI_TDL">TI_TDL (Tundla)</SelectItem>
                          <SelectItem value="TI_AGC">TI_AGC (Agra Fort)</SelectItem>
                          <SelectItem value="TI_PRJ">TI_PRJ (Prayagraj)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Only users under the selected TI can attempt the exam within this time window.</p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Schedule"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {role === "super_admin" && (
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Exam Schedule</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Exam / Assessment Title</Label>
                  <Input placeholder="e.g., Safety Rules Assessment" value={editForm.examTitle} onChange={(e) => setEditForm({ ...editForm, examTitle: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Assign to TI</Label>
                  <Select value={editForm.adminName} onValueChange={(v) => setEditForm({ ...editForm, adminName: v })}>
                    <SelectTrigger><SelectValue placeholder="Select TI" /></SelectTrigger>
                    <SelectContent>
                      {admins.length > 0 ? (
                        admins.map((a) => (
                          <SelectItem key={a.id} value={a.admin_name}>
                            {a.admin_name} ({a.location})
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="TI_SKB">TI_SKB (Sikohabad)</SelectItem>
                          <SelectItem value="TI_TDL">TI_TDL (Tundla)</SelectItem>
                          <SelectItem value="TI_AGC">TI_AGC (Agra Fort)</SelectItem>
                          <SelectItem value="TI_PRJ">TI_PRJ (Prayagraj)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Updating..." : "Update Schedule"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-railway-gold/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-railway-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{schedules.length}</p>
              <p className="text-xs text-muted-foreground">Total Schedules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{schedulesWithStatus.filter((s) => s.currentStatus === "upcoming").length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-railway-navy/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-railway-navy" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueTIs.size}</p>
              <p className="text-xs text-muted-foreground">TIs Assigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>TI</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time Window</TableHead>
                <TableHead>Status</TableHead>
                {role === "super_admin" && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedulesWithStatus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === "super_admin" ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No schedules created yet.
                  </TableCell>
                </TableRow>
              ) : (
                schedulesWithStatus.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.exam_title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.admin_name}</Badge>
                    </TableCell>
                    <TableCell>{new Date(s.scheduled_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                    <TableCell className="text-sm">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${statusColor(s.currentStatus)}`}>{s.currentStatus}</span>
                    </TableCell>
                    {role === "super_admin" && (
                      <TableCell className="text-right space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(s)}
                          disabled={loading}
                        >
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(s)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    )}
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
