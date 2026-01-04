import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, ChevronLeft, ChevronRight, Loader2, 
  Trash2, Video, Images, Camera, Copy, ClipboardList,
  ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentsDB, ContentItem, ContentType } from "@/hooks/useContentsDB";
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

export function MyCalendarView() {
  const { toast } = useToast();
  const { contents, loading, updateContent } = useContentsDB();
  const { posts: savedPosts, loading: loadingPosts, archivePost } = useSavedPosts();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [postToRemove, setPostToRemove] = useState<ContentItem | null>(null);
  const [postToDelete, setPostToDelete] = useState<SavedPost | null>(null);
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

  const handleRemoveFromCalendar = async () => {
    if (!postToRemove) return;
    // Just remove the date, don't delete the content
    await updateContent(postToRemove.id, { date: undefined });
    setPostToRemove(null);
    toast({
      title: "Post removido",
      description: "O post foi removido do calendário, mas continua salvo na sua conta.",
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
    if (post.short_caption) parts.push(post.short_caption);
    if (post.expanded_text) parts.push(post.expanded_text);
    if (post.hashtags && post.hashtags.length > 0) {
      parts.push(post.hashtags.join(" "));
    }
    copyToClipboard(parts.join("\n\n"), "Conteúdo");
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    await archivePost(postToDelete.id);
    setPostToDelete(null);
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
                    const Icon = typeIcons[content.type];
                    return (
                      <div
                        key={content.id}
                        className={`group relative text-[10px] md:text-xs p-1 md:p-1.5 rounded ${typeColors[content.type]} cursor-pointer`}
                        title={content.title}
                      >
                        <div className="flex items-center gap-1">
                          <Icon className="w-3 h-3 shrink-0" />
                          <span className="truncate flex-1">{content.title}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPostToRemove(content);
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          title="Remover do calendário"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
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
              const hasExpandableContent = (post.short_caption && post.short_caption.length > 100) || 
                                           (post.hashtags && post.hashtags.length > 5);
              
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
                      <h4 className="font-medium text-foreground text-sm md:text-base mb-1 line-clamp-2">
                        {post.title}
                      </h4>
                      {post.short_caption && (
                        <p className={`text-xs md:text-sm text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {post.short_caption}
                        </p>
                      )}
                      
                      {/* Expanded content */}
                      {isExpanded && post.hashtags && post.hashtags.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Hashtags:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {post.hashtags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                              >
                                #{tag.replace(/^#/, "")}
                              </span>
                            ))}
                          </div>
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
                        onClick={() => setPostToDelete(post)}
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

      {/* Alert Dialog for removing from calendar */}
      <AlertDialog open={!!postToRemove} onOpenChange={() => setPostToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do calendário?</AlertDialogTitle>
            <AlertDialogDescription>
              O post "{postToRemove?.title}" será removido desta data, mas continuará salvo na sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFromCalendar}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for deleting saved post */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
            <AlertDialogDescription>
              O post "{postToDelete?.title}" será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}