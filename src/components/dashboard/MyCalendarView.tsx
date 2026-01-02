import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, CheckCircle2, XCircle, MinusCircle, 
  Loader2, AlertCircle
} from "lucide-react";
import { useCalendarPlanner, CalendarDay } from "@/hooks/useCalendarPlanner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const { calendar, initialLoading } = useCalendarPlanner();
  const [daysWithStatus, setDaysWithStatus] = useState<DayWithStatus[]>([]);

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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (calendar.length === 0) {
    return (
      <div className="space-y-6">
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

        {/* Empty State */}
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
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
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
        
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
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
    </div>
  );
}
