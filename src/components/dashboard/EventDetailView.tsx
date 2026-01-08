import { useState } from "react";
import { ArrowLeft, Calendar, Edit2, CheckCircle2, Clock, Clipboard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Event } from "@/hooks/useEvents";
import { EventChecklistSection } from "./EventChecklistSection";
import { EventPaymentSection } from "./EventPaymentSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const eventTypeLabels: Record<string, string> = {
  casamento: "Casamento",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  outro: "Outro",
};

interface EventDetailViewProps {
  event: Event & { status?: "ativo" | "concluido"; notes?: string };
  onBack: () => void;
  onEdit: () => void;
  onStatusChange: (status: "ativo" | "concluido") => void;
}

export const EventDetailView = ({
  event,
  onBack,
  onEdit,
  onStatusChange,
}: EventDetailViewProps) => {
  const [activeTab, setActiveTab] = useState("checklist");
  const isMobile = useIsMobile();

  const status = event.status || "ativo";
  const isActive = status === "ativo";

  const eventDate = parseISO(event.event_date);
  
  // Formato compacto para mobile: "Sáb, 10 Jan 2026"
  // Formato completo para desktop: "sábado, 10 de janeiro de 2026"
  const formattedDate = isMobile
    ? format(eventDate, "EEE, dd MMM yyyy", { locale: ptBR })
    : format(eventDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">
                {eventTypeLabels[event.event_type] || event.event_type}
              </span>
              <Badge
                variant={isActive ? "outline" : "secondary"}
                className={`text-xs whitespace-nowrap ${
                  isActive ? "border-warning text-warning" : "border-success text-success"
                }`}
              >
                {isActive ? (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Ativo
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Concluído
                  </>
                )}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground line-clamp-2 leading-tight">
              {event.name}
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="capitalize whitespace-nowrap text-sm sm:text-base">{formattedDate}</span>
            </div>
            {event.notes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.notes}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-11 sm:ml-0">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant={isActive ? "secondary" : "outline"}
            size="sm"
            onClick={() => onStatusChange(isActive ? "concluido" : "ativo")}
          >
            {isActive ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Concluir
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Reativar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="checklist" className="gap-2">
            <Clipboard className="h-4 w-4" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Pagamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="mt-6">
          <EventChecklistSection eventId={event.id} />
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <EventPaymentSection eventId={event.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
