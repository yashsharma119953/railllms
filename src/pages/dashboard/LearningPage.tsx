import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, FileText, Video, Image, FileIcon, ExternalLink, Play } from "lucide-react";

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function LearningPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ title: string; url: string } | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchCourses() {
      const { data } = await supabase.from("courses").select("*").eq("is_published", true);
      if (data) setCourses(data);
    }
    fetchCourses();
  }, []);

  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-5 h-5" />;
      case "image": return <Image className="w-5 h-5" />;
      case "pdf": return <FileText className="w-5 h-5" />;
      default: return <FileIcon className="w-5 h-5" />;
    }
  };

  const openVideo = (course: any) => {
    setActiveVideo({ title: course.title, url: course.file_url });
    setVideoOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">📚 {t("learningSection")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("accessCourses")}</p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t("noCourses")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2 bg-railway-gold" />
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-railway-gold/10 flex items-center justify-center text-railway-gold shrink-0">
                    {typeIcon(course.content_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm leading-tight">{course.title}</h3>
                    <Badge variant="secondary" className="mt-1 text-xs uppercase">{course.content_type}</Badge>
                  </div>
                </div>
                {course.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                )}
                {course.content_type === "video" && course.file_url ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => openVideo(course)}>
                    <Play className="w-3 h-3 mr-2" /> {t("watchVideo")}
                  </Button>
                ) : course.file_url ? (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={course.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-2" /> {t("openMaterial")}
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{activeVideo?.title}</DialogTitle>
          </DialogHeader>
          {activeVideo && (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              {getYouTubeEmbedUrl(activeVideo.url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(activeVideo.url)!}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeVideo.title}
                />
              ) : (
                <video src={activeVideo.url} controls className="w-full h-full" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
