import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Upload, FileText, Video, Image, FileIcon, Link } from "lucide-react";

export default function ContentManagement() {
  const [courses, setCourses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", content_type: "pdf", video_url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, role } = useAuth();

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (data) setCourses(data);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      let fileUrl: string | null = null;

      if (form.content_type === "video") {
        fileUrl = form.video_url;
        if (!fileUrl) throw new Error("Please enter a video link");
      } else if (file) {
        const ext = file.name.split(".").pop();
        const path = `courses/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("content").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("content").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("courses").insert({
        title: form.title,
        description: form.description,
        content_type: form.content_type,
        file_url: fileUrl,
        created_by: null,
        is_published: true,
      });
      if (error) throw error;

      toast.success("Content uploaded successfully!");
      setOpen(false);
      setForm({ title: "", description: "", content_type: "pdf", video_url: "" });
      setFile(null);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "image": return <Image className="w-4 h-4" />;
      case "pdf": return <FileText className="w-4 h-4" />;
      default: return <FileIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            {role === "super_admin" ? "Content Upload" : "Assign Content"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage learning materials</p>
        </div>
        {role === "super_admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-railway-navy hover:bg-railway-navy-light text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Learning Content</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v, video_url: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="ppt">PPT</SelectItem>
                      <SelectItem value="doc">Document</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.content_type === "video" ? (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Link className="w-4 h-4" /> Video Link (YouTube / URL)
                    </Label>
                    <Input
                      placeholder="https://youtube.com/watch?v=... or direct video URL"
                      value={form.video_url}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Video will be embedded and played in-frame for users.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Uploading..." : "Upload Content"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No content yet.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {typeIcon(course.content_type)}
                        <span className="font-medium">{course.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="uppercase text-xs">{course.content_type}</TableCell>
                    <TableCell>
                      <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(course.created_at).toLocaleDateString()}
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
