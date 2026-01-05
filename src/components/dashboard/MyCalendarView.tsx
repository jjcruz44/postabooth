import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, ChevronLeft, ChevronRight, Loader2, 
  Trash2, Video, Images, Camera, Copy, ClipboardList,
  ChevronDown, ChevronUp, Check, X, Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentsDB, ContentItem, ContentType, ContentStatus } from "@/hooks/useContentsDB";
import { useSavedPosts, SavedPost } from "@/hooks/useSavedPosts";
import { useToast } from "@/hooks/use-toast";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const typeIcons: Record<ContentType, React.ElementType> = {
  reels: Video,
  carrossel: Images,
  stories: Camera,
};

const typeColors: Record<ContentType, string> = {
  reels: "bg-purple-500/20 text-purple-500",
  carrossel: "bg-info/20 text-info",
  stories: "bg-pink-500/20 text-pink-500",
};

// Status visual configuration for calendar
const calendarStatusConfig: Record<ContentStatus, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  publicado: { bg: "bg-success/20", text: "text-success", icon: Check, label: "Publicado" },
  nao_publicado: { bg: "bg-muted", text: "text-muted-foreground", icon: X, label: "Não Publicado" },
  ignorado: { bg: "bg-muted/50", text: "text-muted-foreground opacity-50", icon: Ban, label: "Ignorado" },
  ideia: { bg: "bg-muted", text: "text-muted-foreground", icon: X, label: "Não Publicado" },
  producao: { bg: "bg-muted", text: "text-muted-foreground", icon: X, label: "Não Publicado" },
  pronto: { bg: "bg-muted", text: "text-muted-foreground", icon: X, label: "Não Publicado" },
};

export function MyCalendarView() {
  const { toast } = useToast();
  const { contents, loading, updateContent, deleteContent } = useContentsDB();
  const { posts: savedPosts, loading: loadingPosts, archivePost } = useSavedPosts();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [postToDelete, setPostToDelete] = useState<ContentItem | null>(null);
  const [savedPostToDelete, setSavedPostToDelete] = useState<SavedPost | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remainingSlots; i++) {
      days.push(null);
    }
    return days;
  }, [year, month, daysInMonth, startingDayOfWeek]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateKey = (day: number) => {
    const d = new Date(year, month, day);
    return d.toISOString().split("T")[0];
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isPastDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    dayDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return dayDate < todayDate;
  };

  const getContentsForDay = (day: number) => {
    const dateKey = formatDateKey(day);
    return contents.filter((c) => c.date === dateKey);
  };

  const handleDeleteFromCalendar = async () => {
    if (!postToDelete) return;
    await deleteContent(postToDelete.id);
    setPostToDelete(null);
    toast({
      title: "Post excluído",
      description: "O post foi excluído definitivamente da sua conta.",
    });
  };

  const handleUpdateStatus = async (contentId: string, status: ContentStatus) => {
    await updateContent(contentId, { status });
    toast({
      title: "Status atualizado",
      description: `Post marcado como "${calendarStatusConfig[status].label}"`,
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `${label} copiada!`,
        description: "Conteúdo copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const copyAll = (post: SavedPost) => {
    const parts: string[] = [];
    if (post.title) parts.push(`📌 ${post.title}`);
    if (post.ideia) parts.push(`💡 Ideia: ${post.ideia}`);
    if (post.expanded_text) parts.push(`📋 Roteiro:\n${post.expanded_text}`);
    if (post.short_caption) parts.push(`✍️ Legenda:\n${post.short_caption}`);
    copyToClipboard(parts.join("\n\n"), "Conteúdo completo");
  };

  const handleDeleteSavedPost = async () => {
    if (!savedPostToDelete) return;
    await archivePost(savedPostToDelete.id);
    setSavedPostToDelete(null);
  };

  const getSourceLabel = (source: string) => {
    return source === "gerador" ? "Gerador" : "Sugestões IA";
  };

  const toggleExpand = (postId: string) => {
    setExpandedPostId((prev) => (prev === postId ? null : postId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          Meu Calendário
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Visualize e gerencie seus posts agendados por data
        </p>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-3 md:p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <h3 className="font-semibold text-foreground capitalize">{monthName}</h3>
            <Button variant="link" size="sm" onClick={goToToday} className="text-xs h-auto p-0">
              Ir para hoje
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/20">
          {WEEKDAYS.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[80px] md:min-h-[100px] border-r border-b border-border bg-muted/10" />;
            }

            const dayContents = getContentsForDay(day);
            const isPast = isPastDay(day);
            const isTodayDay = isToday(day);

            return (
              <div
                key={day}
                className={`min-h-[80px] md:min-h-[100px] border-r border-b border-border p-1.5 md:p-2 transition-colors ${
                  isPast ? "bg-muted/30 opacity-60" : "bg-card hover:bg-muted/20"
                } ${isTodayDay ? "ring-2 ring-inset ring-primary" : ""}`}
              >
                <div className={`text-xs md:text-sm font-medium mb-1 ${
                  isTodayDay ? "text-primary font-bold" : isPast ? "text-muted-foreground" : "text-foreground"
                }`}>
                  {day}
                </div>
                
                <div className="space-y-1">
                  {dayContents.slice(0, 2).map((content) => {
                    const TypeIcon = typeIcons[content.type];
                    const statusConfig = calendarStatusConfig[content.status];
                    const StatusIcon = statusConfig.icon;
                    const isIgnored = content.status === "ignorado";
                    const isPublished = content.status === "publicado";
                    
                    return (
                      <Popover key={content.id}>
                        <PopoverTrigger asChild>
                          <div
                            className={`group relative text-[10px] md:text-xs p-1 md:p-1.5 rounded cursor-pointer transition-all ${
                              isIgnored 
                                ? "bg-muted/40 text-muted-foreground opacity-50" 
                                : isPublished 
                                  ? "bg-success/20 text-success border border-success/30" 
                                  : typeColors[content.type]
                            }`}
                            title={content.title}
                          >
                            <div className="flex items-center gap-1">
                              {isPublished && <Check className="w-2.5 h-2.5 shrink-0" />}
                              {isIgnored && <Ban className="w-2.5 h-2.5 shrink-0" />}
                              {!isPublished && !isIgnored && <TypeIcon className="w-3 h-3 shrink-0" />}
                              <span className="truncate flex-1">{content.title}</span>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-foreground mb-2 truncate">{content.title}</p>
                            <p className="text-[10px] text-muted-foreground mb-2">Definir status:</p>
                            <button
                              onClick={() => handleUpdateStatus(content.id, "publicado")}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                                content.status === "publicado" 
                                  ? "bg-success/20 text-success" 
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Publicado
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(content.id, "nao_publicado")}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                                content.status === "nao_publicado" || (!["publicado", "ignorado"].includes(content.status))
                                  ? "bg-muted text-muted-foreground" 
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              Não Publicado
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(content.id, "ignorado")}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                                content.status === "ignorado" 
                                  ? "bg-muted/50 text-muted-foreground opacity-60" 
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Ignorado
                            </button>
                            <div className="border-t border-border mt-2 pt-2">
                              <button
                                onClick={() => setPostToDelete(content)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Excluir definitivamente
                              </button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                  {dayContents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{dayContents.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Standalone Posts Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-secondary flex items-center justify-center">
            <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-foreground">Posts Avulsos</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Conteúdos salvos do Gerador e das Sugestões da IA
            </p>
          </div>
        </div>

        {loadingPosts ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : savedPosts.length > 0 ? (
          <div className="space-y-3">
            {savedPosts.map((post, index) => {
              const isExpanded = expandedPostId === post.id;
              const hasExpandableContent = post.ideia || post.expanded_text;
              
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border p-3 md:p-4"
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {getSourceLabel(post.source)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <h4 className="font-medium text-foreground text-sm md:text-base mb-2">
                        {post.scheduled_date && (
                          <span className="text-primary font-semibold mr-2">
                            {new Date(post.scheduled_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                        )}
                        {post.title}
                      </h4>
                      
                      {/* Legenda always visible */}
                      {post.short_caption && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Legenda:</p>
                          <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap">
                            {post.short_caption}
                          </p>
                        </div>
                      )}
                      
                      {/* Expanded content: Ideia + Roteiro */}
                      {isExpanded && (
                        <div className="space-y-3 mt-3 pt-3 border-t border-border">
                          {post.ideia && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Ideia Principal:</p>
                              <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap">
                                {post.ideia}
                              </p>
                            </div>
                          )}
                          {post.expanded_text && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Roteiro:</p>
                              <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap">
                                {post.expanded_text}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 pt-3 border-t border-border">
                    {hasExpandableContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(post.id)}
                        className="gap-1 text-xs h-9 justify-center"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Ver mais
                          </>
                        )}
                      </Button>
                    )}
                    
                    <div className="flex items-center gap-1 sm:gap-2 sm:ml-auto">
                      {post.short_caption && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(post.short_caption!, "Legenda")}
                          className="flex-1 sm:flex-none h-9 gap-1.5 text-xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="sm:hidden">Legenda</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyAll(post)}
                        className="flex-1 sm:flex-none h-9 gap-1.5 text-xs"
                      >
                        <ClipboardList className="w-3 h-3" />
                        <span className="sm:hidden">Tudo</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSavedPostToDelete(post)}
                        className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl border border-dashed border-border p-6 md:p-8 text-center">
            <ClipboardList className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-foreground mb-1">Nenhum post avulso salvo</h4>
            <p className="text-sm text-muted-foreground">
              Use o Gerador de Posts para criar e salvar conteúdos.
            </p>
          </div>
        )}
      </div>

      {/* Alert Dialog for deleting from calendar (DEFINITIVE) */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este post definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              O post "{postToDelete?.title}" será excluído permanentemente da sua conta. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFromCalendar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for deleting saved post */}
      <AlertDialog open={!!savedPostToDelete} onOpenChange={() => setSavedPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post avulso?</AlertDialogTitle>
            <AlertDialogDescription>
              O post "{savedPostToDelete?.title}" será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSavedPost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}