import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Video, Image, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/hooks/useCalendar";
import { ContentItem, ContentType } from "@/hooks/useContents";

const typeIcons: Record<ContentType, React.ElementType> = {
  reels: Video,
  carrossel: Image,
  stories: MessageSquare,
};

interface CalendarViewProps {
  contents: ContentItem[];
  stats: {
    ideia: number;
    producao: number;
    pronto: number;
    publicado: number;
  };
  onNewContent: () => void;
  onSelectContent: (content: ContentItem) => void;
}

export function CalendarView({ contents, stats, onNewContent, onSelectContent }: CalendarViewProps) {
  const {
    year,
    monthName,
    calendarDays,
    goToPreviousMonth,
    goToNextMonth,
    formatDateForContent,
    isToday,
  } = useCalendar();

  const getContentsForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = formatDateForContent(day);
    return contents.filter((c) => c.date === dateStr);
  };

  const statItems = [
    { label: "Ideias", value: stats.ideia, color: "text-muted-foreground" },
    { label: "Em produção", value: stats.producao, color: "text-warning" },
    { label: "Prontos", value: stats.pronto, color: "text-info" },
    { label: "Publicados", value: stats.publicado, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {monthName} {year}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <Button className="gap-2" onClick={onNewContent}>
          <Plus className="w-4 h-4" />
          Novo conteúdo
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Week days */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayContents = getContentsForDay(day);

            return (
              <div
                key={i}
                className={`min-h-24 p-2 border-b border-r border-border last:border-r-0 ${
                  day === null ? "bg-muted/30" : ""
                }`}
              >
                {day !== null && (
                  <>
                    <div
                      className={`text-sm mb-1 ${
                        isToday(day)
                          ? "w-6 h-6 rounded-full gradient-primary text-primary-foreground flex items-center justify-center font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayContents.slice(0, 2).map((content) => {
                        const Icon = typeIcons[content.type];
                        return (
                          <button
                            key={content.id}
                            onClick={() => onSelectContent(content)}
                            className="w-full bg-primary/10 rounded-md p-1.5 text-xs text-left hover:bg-primary/20 transition-colors"
                          >
                            <div className="flex items-center gap-1 text-primary font-medium truncate">
                              <Icon className="w-3 h-3 shrink-0" />
                              <span className="truncate">{content.title}</span>
                            </div>
                          </button>
                        );
                      })}
                      {dayContents.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayContents.length - 2} mais
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
