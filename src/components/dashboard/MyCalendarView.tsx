import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, CheckCircle2, XCircle, MinusCircle, 
  Loader2, AlertCircle, FileText, Copy, Hash, Trash2
} from "lucide-react";
import { useCalendarPlanner, CalendarDay } from "@/hooks/useCalendarPlanner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type PostStatus = "postado" | "nao_postado" | "ignorado";

interface DayWithStatus extends CalendarDay {
  status: PostStatus;
}

interface StandalonePost {
  id: string;
  title: string;
  legenda: string | null;
  hashtags: string[] | null;
  type: string;
  created_at: string;
}

const statusConfig: Record<PostStatus, { icon: React.ElementType; color: string; label: string }> = {
  postado: { icon: CheckCircle2, color: "bg-success/10 text-success border-success/30", label: "Postado" },
  nao_postado: { icon: XCircle, color: "bg-muted/50 text-muted-foreground border-border", label: "Não postado" },
  ignorado: { icon: MinusCircle, color: "bg-warning/10 text-warning border-warning/30", label: "Ignorado" },
};

const STORAGE_KEY = "my_calendar_status";

export function MyCalendarView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { calendar, initialLoading } = useCalendarPlanner();
  const [daysWithStatus, setDaysWithStatus] = useState<DayWithStatus[]>([]);
  const [standalonePosts, setStandalonePosts] = useState<StandalonePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

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

  // Fetch standalone posts (without scheduled_date)
  useEffect(() => {
    const fetchStandalonePosts = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("contents")
          .select("id, title, legenda, hashtags, type, created_at")
          .eq("user_id", user.id)
          .is("scheduled_date", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setStandalonePosts(data || []);
      } catch (error) {
        console.error("Error fetching standalone posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchStandalonePosts();
  }, [user]);

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

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("contents")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      setStandalonePosts((prev) => prev.filter((p) => p.id !== postId));
      toast({
        title: "Post excluído",
        description: "O post foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o post.",
        variant: "destructive",
      });
    }
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-7 h-7 text-primary" />
          Meu Calendário
        </h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe o que você já postou neste mês e mantenha consistência.
        </p>
      </div>

      {/* Calendar Section */}
      {hasCalendar ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon;
              const count = stats[key as PostStatus];
              return (
                <div key={key} className={`p-4 rounded-xl border ${config.color}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <div className="text-3xl font-bold mt-2">{count}</div>
                  <div className="text-xs opacity-70 mt-1">
                    de {daysWithStatus.length} dias
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progresso do mês</span>
              <span className="text-sm text-muted-foreground">
                {stats.postado} de {daysWithStatus.length} postados
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-300"
                style={{ width: `${(stats.postado / daysWithStatus.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Calendar List */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Clique em um dia para alterar o status
              </p>
            </div>
            
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
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
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                        {day.day}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium truncate">{day.idea}</p>
                        <p className="text-sm text-muted-foreground truncate">{day.objective}</p>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color}`}>
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
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum planejamento encontrado
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
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
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <FileText className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Posts Avulsos</h3>
            <p className="text-sm text-muted-foreground">
              Conteúdos salvos para usar quando quiser
            </p>
          </div>
        </div>

        {loadingPosts ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : standalonePosts.length > 0 ? (
          <div className="space-y-3">
            {standalonePosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {post.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground mb-1 line-clamp-1">
                      {post.title}
                    </h4>
                    {post.legenda && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.legenda}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {post.legenda && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(post.legenda!, "Legenda")}
                        className="h-8 w-8"
                        title="Copiar legenda"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(post.hashtags!.join(" "), "Hashtags")}
                        className="h-8 w-8"
                        title="Copiar hashtags"
                      >
                        <Hash className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePost(post.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Excluir post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl border border-dashed border-border p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhum post avulso salvo ainda
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Posts criados no Gerador sem data aparecerão aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
