import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, CheckCircle2, XCircle, MinusCircle, 
  Loader2, AlertCircle, FileText, Copy, Hash, Trash2, ClipboardList,
  ChevronDown, ChevronUp
} from "lucide-react";
import { useCalendarPlanner, CalendarDay } from "@/hooks/useCalendarPlanner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSavedPosts, SavedPost } from "@/hooks/useSavedPosts";
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

type PostStatus = "postado" | "nao_postado" | "ignorado";

interface DayWithStatus extends CalendarDay {
  status: PostStatus;
}

const statusConfig: Record<PostStatus, { icon: React.ElementType; color: string; label: string }> = {
  postado: { icon: CheckCircle2, color: "bg-success/10 text-success border-success/30", label: "Postado" },
  nao_postado: { icon: XCircle, color: "bg-muted/50 text-muted-foreground border-border", label: "Não postado" },
  ignorado: { icon: MinusCircle, color: "bg-warning/10 text-warning border-warning/30", label: "Ignorado" },
};

const STORAGE_KEY = "my_calendar_status";

export function MyCalendarView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { calendar, initialLoading } = useCalendarPlanner();
  const { posts: savedPosts, loading: loadingPosts, archivePost } = useSavedPosts();
  const [daysWithStatus, setDaysWithStatus] = useState<DayWithStatus[]>([]);
  const [postToDelete, setPostToDelete] = useState<SavedPost | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Load saved statuses from localStorage on mount
  useEffect(() => {
    if (calendar.length > 0) {
      const savedStatuses = localStorage.getItem(STORAGE_KEY);
      const statusMap: Record<number, PostStatus> = savedStatuses ? JSON.parse(savedStatuses) : {};
      
      const withStatus = calendar.map((day) => ({
        ...day,
        status: statusMap[day.day] || "nao_postado" as PostStatus,
      }));
      
      setDaysWithStatus(withStatus);
    }
  }, [calendar]);

  // Save statuses to localStorage whenever they change
  const updateStatus = (dayNumber: number, newStatus: PostStatus) => {
    setDaysWithStatus((prev) => {
      const updated = prev.map((d) =>
        d.day === dayNumber ? { ...d, status: newStatus } : d
      );
      
      // Save to localStorage
      const statusMap: Record<number, PostStatus> = {};
      updated.forEach((d) => {
        statusMap[d.day] = d.status;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statusMap));
      
      return updated;
    });
  };

  const cycleStatus = (dayNumber: number) => {
    const currentDay = daysWithStatus.find((d) => d.day === dayNumber);
    if (!currentDay) return;

    const statusOrder: PostStatus[] = ["nao_postado", "postado", "ignorado"];
    const currentIndex = statusOrder.indexOf(currentDay.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    updateStatus(dayNumber, nextStatus);
  };

  const getStats = () => {
    const stats = {
      postado: daysWithStatus.filter((d) => d.status === "postado").length,
      nao_postado: daysWithStatus.filter((d) => d.status === "nao_postado").length,
      ignorado: daysWithStatus.filter((d) => d.status === "ignorado").length,
    };
    return stats;
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = getStats();
  const hasCalendar = calendar.length > 0;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          Meu Calendário
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Acompanhe o que você já postou neste mês e mantenha consistência.
        </p>
      </div>

      {/* Calendar Section */}
      {hasCalendar ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon;
              const count = stats[key as PostStatus];
              return (
                <div key={key} className={`p-3 md:p-4 rounded-xl border ${config.color}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-medium text-sm md:text-base">{config.label}</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{count}</div>
                  <div className="text-xs opacity-70 mt-1">
                    de {daysWithStatus.length} dias
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="bg-card rounded-xl border border-border p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progresso do mês</span>
              <span className="text-xs md:text-sm text-muted-foreground">
                {stats.postado} de {daysWithStatus.length} postados
              </span>
            </div>
            <div className="h-2 md:h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-300"
                style={{ width: `${(stats.postado / daysWithStatus.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Calendar List */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-3 md:p-4 border-b border-border bg-muted/30">
              <p className="text-xs md:text-sm text-muted-foreground">
                Clique em um dia para alterar o status
              </p>
            </div>
            
            <div className="divide-y divide-border max-h-[350px] md:max-h-[400px] overflow-y-auto">
              {daysWithStatus.map((day, index) => {
                const config = statusConfig[day.status];
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => cycleStatus(day.day)}
                    className="p-3 md:p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start md:items-center gap-3 md:gap-4 flex-col sm:flex-row">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                          {day.day}
                        </div>
                        
                        <div className="flex-1 min-w-0 sm:hidden">
                          <p className="text-foreground font-medium text-sm line-clamp-1">{day.idea}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{day.objective}</p>
                        </div>
                        
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${config.color} sm:hidden`}>
                          <Icon className="w-3 h-3" />
                          <span className="text-xs font-medium">{config.label}</span>
                        </div>
                      </div>
                      
                      <div className="hidden sm:block flex-1 min-w-0">
                        <p className="text-foreground font-medium truncate">{day.idea}</p>
                        <p className="text-sm text-muted-foreground truncate">{day.objective}</p>
                      </div>
                      
                      <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-card rounded-xl border border-border p-6 md:p-8 text-center">
          <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-medium text-foreground mb-2">
            Nenhum planejamento encontrado
          </h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 max-w-md mx-auto">
            Você precisa criar um planejamento mensal primeiro para acompanhar seu progresso aqui.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="gap-2">
            <Calendar className="w-4 h-4" />
            Ir para Planejamento Mensal
          </Button>
        </div>
      )}

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
                  
                  {/* Actions row - stack on mobile */}
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
                      {post.hashtags && post.hashtags.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(post.hashtags!.join(" "), "Hashtags")}
                          className="flex-1 sm:flex-none h-9 gap-1.5 text-xs"
                        >
                          <Hash className="w-3 h-3" />
                          <span className="sm:hidden">Hashtags</span>
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
            <FileText className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm md:text-base text-muted-foreground">
              Nenhum post avulso salvo ainda
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Salve posts no Gerador ou nas Sugestões da IA
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{postToDelete?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost} 
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
