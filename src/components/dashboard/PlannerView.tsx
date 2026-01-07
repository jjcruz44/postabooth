import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, Sparkles, Loader2, Target, 
  RefreshCw, CheckCircle2, Users, BookOpen, 
  Tag, Eye, MessageSquare, Lock, Calendar,
  MoreVertical, EyeOff, Trash2, ChevronDown, ChevronUp,
  CalendarPlus, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useCalendarPlanner, CalendarDay, TargetMonth } from "@/hooks/useCalendarPlanner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DayContentModal } from "./DayContentModal";
import { ShareButton } from "./ShareButton";

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  "prova social": { icon: Users, color: "bg-success/10 text-success border-success/20", label: "Prova Social" },
  "educativo": { icon: BookOpen, color: "bg-info/10 text-info border-info/20", label: "Educativo" },
  "oferta": { icon: Tag, color: "bg-warning/10 text-warning border-warning/20", label: "Oferta" },
  "bastidores": { icon: Eye, color: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "Bastidores" },
  "storytelling": { icon: MessageSquare, color: "bg-pink-500/10 text-pink-500 border-pink-500/20", label: "Storytelling" },
};

const WEEKDAYS = [
  { id: "segunda", label: "Seg" },
  { id: "terça", label: "Ter" },
  { id: "quarta", label: "Qua" },
  { id: "quinta", label: "Qui" },
  { id: "sexta", label: "Sex" },
  { id: "sábado", label: "Sáb" },
];

const CONTENT_FOCUS_OPTIONS = [
  { value: "Aleatório", label: "Mix de eventos" },
  { value: "Casamento", label: "Casamento" },
  { value: "Corporativo", label: "Corporativo" },
  { value: "15 anos / Aniversário", label: "15 anos / Aniversário" },
];

const MONTH_OBJECTIVES = [
  { value: "Fechar mais eventos", label: "Fechar mais eventos" },
  { value: "Gerar prova social", label: "Gerar prova social" },
  { value: "Aumentar autoridade", label: "Aumentar autoridade" },
  { value: "Educar e tirar dúvidas", label: "Educar e tirar dúvidas" },
  { value: "Promover ofertas ou diferenciais", label: "Promover ofertas ou diferenciais" },
];

export function PlannerView() {
  const { 
    calendar, visiblePosts, hiddenPosts, filters, loading, initialLoading, error, 
    generateCalendar, clearCalendar, updateFilters, hidePost, showPost, deletePost 
  } = useCalendarPlanner();
  const { isPremiumUser } = useAuth();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showHiddenPosts, setShowHiddenPosts] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setModalOpen(true);
  };

  const handleGenerate = async (targetMonth: TargetMonth = 'current') => {
    if (!filters.monthObjective) {
      toast({
        title: "Objetivo necessário",
        description: "Selecione o objetivo principal do mês.",
        variant: "destructive",
      });
      return;
    }

    if (filters.postingDays.length === 0) {
      toast({
        title: "Dias necessários",
        description: "Selecione pelo menos um dia da semana para postar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateCalendar(filters, targetMonth);
      const monthLabel = targetMonth === 'next' ? 'próximo mês' : 'restante do mês';
      toast({
        title: "Calendário gerado!",
        description: `Seu planejamento para ${monthLabel} está pronto.`,
      });
    } catch (err) {
      toast({
        title: "Erro ao gerar",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const handleWeekdayToggle = (weekday: string) => {
    const newDays = filters.postingDays.includes(weekday)
      ? filters.postingDays.filter(d => d !== weekday)
      : [...filters.postingDays, weekday];
    updateFilters({ postingDays: newDays });
  };

  const handleNewCalendar = () => {
    clearCalendar();
  };

  const handleHidePost = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await hidePost(index);
      toast({ title: "Post ocultado", description: "Você pode reexibi-lo na seção de ocultos." });
    } catch {
      toast({ title: "Erro ao ocultar", variant: "destructive" });
    }
  };

  const handleShowPost = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await showPost(index);
      toast({ title: "Post restaurado" });
    } catch {
      toast({ title: "Erro ao restaurar", variant: "destructive" });
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmIndex === null) return;
    try {
      await deletePost(deleteConfirmIndex);
      toast({ title: "Post excluído permanentemente" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setDeleteConfirmIndex(null);
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    visiblePosts.forEach((day) => {
      stats[day.category] = (stats[day.category] || 0) + 1;
    });
    return stats;
  };

  const getCurrentMonthName = () => {
    const date = new Date();
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getNextMonthName = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Show premium paywall for free users
  if (!isPremiumUser) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            Planejamento Mensal
            <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning font-semibold">
              Premium
            </span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Crie um calendário personalizado baseado na sua rotina
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-8 md:p-12 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Lock className="w-8 h-8 md:w-10 md:h-10 text-warning" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
            Recurso exclusivo para assinantes Premium
          </h3>
          <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-lg mx-auto">
            O Planejamento Mensal cria um calendário personalizado baseado na sua rotina e objetivo do mês, 
            gerando apenas os posts que você realmente precisa.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 max-w-2xl mx-auto text-left">
            <div className="p-3 md:p-4 rounded-lg border border-border bg-muted/30">
              <Calendar className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">Frequência flexível</p>
              <p className="text-xs text-muted-foreground">Escolha quantos dias por semana postar</p>
            </div>
            <div className="p-3 md:p-4 rounded-lg border border-border bg-muted/30">
              <Target className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">Objetivo focado</p>
              <p className="text-xs text-muted-foreground">Todos os posts alinhados à sua meta</p>
            </div>
            <div className="p-3 md:p-4 rounded-lg border border-border bg-muted/30">
              <Sparkles className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">Conteúdo completo</p>
              <p className="text-xs text-muted-foreground">Roteiro e legenda prontos para usar</p>
            </div>
          </div>

          <Button size="lg" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Seja Premium
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            Planejamento Mensal
            <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning font-semibold">
              Premium
            </span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1 capitalize">
            {getCurrentMonthName()}
          </p>
        </div>
        {calendar.length > 0 && (
          <Button variant="outline" onClick={handleNewCalendar} className="gap-2 w-full sm:w-auto">
            <RefreshCw className="w-4 h-4" />
            Novo planejamento
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
            className="space-y-4 md:space-y-6"
          >
            {/* Filters Card */}
            <div className="bg-card rounded-xl border border-border p-4 md:p-6 space-y-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Configure seu planejamento
              </h3>

              {/* Month Objective - Required */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Objetivo do mês <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={filters.monthObjective} 
                  onValueChange={(value) => updateFilters({ monthObjective: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OBJECTIVES.map((obj) => (
                      <SelectItem key={obj.value} value={obj.value}>
                        {obj.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Este objetivo irá orientar o tom e a ideia de todos os posts
                </p>
              </div>

              {/* Posting Days */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Dias da semana para postar <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => handleWeekdayToggle(day.id)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        filters.postingDays.includes(day.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filters.postingDays.length} dia{filters.postingDays.length !== 1 ? 's' : ''} selecionado{filters.postingDays.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Content Focus */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Foco do conteúdo</Label>
                <Select 
                  value={filters.contentFocus} 
                  onValueChange={(value) => updateFilters({ contentFocus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_FOCUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start from Tomorrow Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Começar a partir de amanhã</Label>
                  <p className="text-xs text-muted-foreground">
                    {filters.startFromTomorrow 
                      ? "O planejamento começa amanhã" 
                      : "Inclui hoje se for um dia selecionado"}
                  </p>
                </div>
                <Switch
                  checked={filters.startFromTomorrow}
                  onCheckedChange={(checked) => updateFilters({ startFromTomorrow: checked })}
                />
              </div>
            </div>

            {/* Distribution Preview */}
            <div className="bg-card rounded-xl border border-border p-4 md:p-6">
              <h3 className="font-medium text-foreground mb-3 md:mb-4 text-sm md:text-base">Distribuição do conteúdo</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const percentage = key === "prova social" ? 30 : key === "educativo" ? 20 : key === "oferta" ? 20 : 15;
                  return (
                    <div key={key} className={`p-2.5 md:p-3 rounded-lg border ${config.color}`}>
                      <Icon className="w-4 h-4 md:w-5 md:h-5 mb-1.5 md:mb-2" />
                      <div className="text-xs md:text-sm font-medium">{config.label}</div>
                      <div className="text-xs opacity-70">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generate Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                size="lg"
                onClick={() => handleGenerate('current')}
                disabled={loading || !filters.monthObjective || filters.postingDays.length === 0}
                className="gap-2 h-12 md:h-14 text-sm md:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Gerar para o restante do mês
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleGenerate('next')}
                disabled={loading || !filters.monthObjective || filters.postingDays.length === 0}
                className="gap-2 h-12 md:h-14 text-sm md:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-5 h-5" />
                    Gerar para {getNextMonthName()}
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-3 md:p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 md:space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
              {Object.entries(getCategoryStats()).map(([category, count]) => {
                const config = categoryConfig[category] || categoryConfig["prova social"];
                const Icon = config.icon;
                return (
                  <div key={category} className={`p-2.5 md:p-3 rounded-lg border ${config.color}`}>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm font-medium truncate">{config.label}</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold mt-1">{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Share CTA */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-sm md:text-base font-medium text-foreground">
                  Gostou do Postabooth?
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Compartilhe com outros donos de cabine/totem!
                </p>
              </div>
              <ShareButton variant="default" className="shrink-0" />
            </div>

            {/* Calendar Header */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-3 md:p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-foreground font-medium text-sm md:text-base">
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success" />
                      {visiblePosts.length} post{visiblePosts.length !== 1 ? 's' : ''} ativos
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Objetivo: {filters.monthObjective} • Foco: {filters.contentFocus}
                    </p>
                  </div>
                  {hiddenPosts.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {hiddenPosts.length} oculto{hiddenPosts.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Calendar List - Visible Posts */}
              <div className="divide-y divide-border max-h-[450px] md:max-h-[600px] overflow-y-auto">
                {calendar.map((day, index) => {
                  if (day.hidden) return null;
                  
                  const config = categoryConfig[day.category] || categoryConfig["prova social"];
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={`${day.day}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-3 md:p-4 transition-colors hover:bg-muted/30 group"
                    >
                      <div className="flex items-start gap-3 md:gap-4">
                        <div 
                          onClick={() => handleDayClick(day)}
                          className="w-12 h-12 md:w-14 md:h-14 rounded-lg gradient-primary flex flex-col items-center justify-center text-primary-foreground shrink-0 cursor-pointer"
                        >
                          <span className="text-lg md:text-xl font-bold leading-none">{day.day}</span>
                          <span className="text-[10px] md:text-xs opacity-80">{day.weekday}</span>
                        </div>
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleDayClick(day)}
                        >
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                              <Icon className="w-3 h-3" />
                              <span className="hidden sm:inline">{config.label}</span>
                            </span>
                          </div>
                          <p className="text-foreground font-medium text-sm md:text-base line-clamp-1">
                            {day.title || day.idea}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {day.idea}
                          </p>
                        </div>
                        
                        {/* Action Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleHidePost(index, e as unknown as React.MouseEvent)}>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Ocultar post
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmIndex(index);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir definitivamente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Hidden Posts Section */}
            {hiddenPosts.length > 0 && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setShowHiddenPosts(!showHiddenPosts)}
                  className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <EyeOff className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {hiddenPosts.length} post{hiddenPosts.length !== 1 ? 's' : ''} oculto{hiddenPosts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {showHiddenPosts ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {showHiddenPosts && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="divide-y divide-border border-t border-border overflow-hidden"
                    >
                      {calendar.map((day, index) => {
                        if (!day.hidden) return null;
                        
                        const config = categoryConfig[day.category] || categoryConfig["prova social"];
                        const Icon = config.icon;
                        
                        return (
                          <div
                            key={`hidden-${day.day}-${index}`}
                            className="p-3 md:p-4 bg-muted/20 group"
                          >
                            <div className="flex items-start gap-3 md:gap-4">
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground shrink-0">
                                <span className="text-lg md:text-xl font-bold leading-none">{day.day}</span>
                                <span className="text-[10px] md:text-xs opacity-80">{day.weekday}</span>
                              </div>
                              <div className="flex-1 min-w-0 opacity-60">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                                    <Icon className="w-3 h-3" />
                                    <span className="hidden sm:inline">{config.label}</span>
                                  </span>
                                </div>
                                <p className="text-foreground font-medium text-sm md:text-base line-clamp-1">
                                  {day.title || day.idea}
                                </p>
                              </div>
                              
                              {/* Action Menu for Hidden Posts */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => handleShowPost(index, e as unknown as React.MouseEvent)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Exibir post
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteConfirmIndex(index)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir definitivamente
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Content Modal */}
      <DayContentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        day={selectedDay}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmIndex !== null} onOpenChange={() => setDeleteConfirmIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O post será removido permanentemente do seu planejamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
