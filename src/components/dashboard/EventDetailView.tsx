import { useState } from "react";
import { ArrowLeft, Calendar, Edit2, CheckCircle2, Clock, Clipboard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Event } from "@/hooks/useEvents";
import { EventChecklistSection } from "./EventChecklistSection";
import { EventPaymentSection } from "./EventPaymentSection";

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

  const status = event.status || "ativo";
  const isActive = status === "ativo";

  const formattedDate = new Date(event.event_date + "T12:00:00").toLocaleDateString(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {eventTypeLabels[event.event_type] || event.event_type}
              </span>
              <Badge
                variant={isActive ? "outline" : "secondary"}
                className={`text-xs ${
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
            <h2 className="text-2xl font-bold text-foreground">{event.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            {event.notes && (
              <p className="text-sm text-muted-foreground mt-2">{event.notes}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
