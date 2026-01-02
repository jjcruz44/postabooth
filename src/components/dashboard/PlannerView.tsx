import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, Sparkles, Loader2, Target, 
  RefreshCw, CheckCircle2, Users, BookOpen, 
  Tag, Eye, MessageSquare, Lock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCalendarPlanner, CalendarDay } from "@/hooks/useCalendarPlanner";
import { useToast } from "@/hooks/use-toast";
import { DayContentModal } from "./DayContentModal";

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  "prova social": { icon: Users, color: "bg-success/10 text-success border-success/20", label: "Prova Social" },
  "educativo": { icon: BookOpen, color: "bg-info/10 text-info border-info/20", label: "Educativo" },
  "oferta": { icon: Tag, color: "bg-warning/10 text-warning border-warning/20", label: "Oferta" },
  "bastidores": { icon: Eye, color: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "Bastidores" },
  "storytelling": { icon: MessageSquare, color: "bg-pink-500/10 text-pink-500 border-pink-500/20", label: "Storytelling" },
};

const goalSuggestions = [
  "Aumentar pedidos de orçamento para casamentos",
  "Divulgar nova cabine 360",
  "Fechar eventos corporativos de fim de ano",
  "Gerar autoridade como especialista em eventos",
  "Promover pacotes promocionais de aniversários",
];

const FREE_DAYS_LIMIT = 3;
const IS_PREMIUM = false; // TODO: Replace with actual subscription check

export function PlannerView() {
  const { calendar, monthlyGoal: savedGoal, loading, initialLoading, error, generateCalendar, clearCalendar } = useCalendarPlanner();
  const { toast } = useToast();
  const [goalInput, setGoalInput] = useState("");
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setModalOpen(true);
  };

  // Sync goal input with saved goal when loaded
  useEffect(() => {
    if (savedGoal && !goalInput) {
      setGoalInput(savedGoal);
    }
  }, [savedGoal]);

  const handleGenerate = async () => {
    if (!goalInput.trim()) {
      toast({
        title: "Objetivo necessário",
        description: "Defina o objetivo principal do mês para gerar o calendário.",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateCalendar(goalInput);
      toast({
        title: "Calendário gerado!",
        description: "Seu planejamento de 30 dias está pronto.",
      });
    } catch (err) {
      toast({
        title: "Erro ao gerar",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const handleSelectGoal = (goal: string) => {
    setGoalInput(goal);
  };

  const handleNewCalendar = () => {
    clearCalendar();
    setGoalInput("");
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    calendar.forEach((day) => {
      stats[day.category] = (stats[day.category] || 0) + 1;
    });
    return stats;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary" />
            Planejamento Mensal
          </h2>
          <p className="text-muted-foreground mt-1">
            Gere um calendário estratégico de 30 dias para suas redes sociais
          </p>
        </div>
        {calendar.length > 0 && (
          <Button variant="outline" onClick={handleNewCalendar} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Novo calendário
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {initialLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </motion.div>
        ) : calendar.length === 0 ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Goal Input */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Target className="w-5 h-5 text-primary" />
                Qual é o objetivo principal do mês?
              </div>
              
              <Textarea
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Ex: Aumentar pedidos de orçamento para casamentos"
                className="min-h-24 resize-none"
              />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Sugestões:</p>
                <div className="flex flex-wrap gap-2">
                  {goalSuggestions.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => handleSelectGoal(goal)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        goalInput === goal
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribution Preview */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-medium text-foreground mb-4">Distribuição do conteúdo</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const percentage = key === "prova social" ? 30 : key === "educativo" ? 20 : key === "oferta" ? 20 : 15;
                  return (
                    <div key={key} className={`p-3 rounded-lg border ${config.color}`}>
                      <Icon className="w-5 h-5 mb-2" />
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-xs opacity-70">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={loading || !goalInput.trim()}
              className="w-full gap-2 h-14 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando calendário...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar calendário de 30 dias
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(getCategoryStats()).map(([category, count]) => {
                const config = categoryConfig[category] || categoryConfig["prova social"];
                const Icon = config.icon;
                return (
                  <div key={category} className={`p-3 rounded-lg border ${config.color}`}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Grid */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Calendário gerado com sucesso
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Objetivo: {savedGoal}
                </p>
              </div>

              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {calendar.map((day, index) => {
                  const config = categoryConfig[day.category] || categoryConfig["prova social"];
                  const Icon = config.icon;
                  const isLocked = !IS_PREMIUM && day.day > FREE_DAYS_LIMIT;
                  
                  return (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleDayClick(day)}
                      className={`p-4 transition-colors cursor-pointer ${
                        isLocked 
                          ? "hover:bg-muted/20 opacity-60" 
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${
                          isLocked 
                            ? "bg-muted text-muted-foreground" 
                            : "gradient-primary text-primary-foreground"
                        }`}>
                          {isLocked ? <Lock className="w-5 h-5" /> : day.day}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </span>
                            {isLocked && (
                              <span className="text-xs text-warning font-medium">Premium</span>
                            )}
                          </div>
                          <p className="text-foreground font-medium">{day.idea}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {day.objective}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Content Modal */}
      <DayContentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        day={selectedDay}
        isPremium={IS_PREMIUM}
      />
    </div>
  );
}
