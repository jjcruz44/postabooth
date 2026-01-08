import { useState, useMemo } from "react";
import { Plus, Calendar, ChevronRight, Trash2, Edit2, CheckCircle2, Clock, DollarSign, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useEvents, Event, useChecklistItems } from "@/hooks/useEvents";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEventPayments } from "@/hooks/useEventPayments";
import { EventFormModal } from "./EventFormModal";
import { EventDetailView } from "./EventDetailView";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const eventTypeLabels: Record<string, string> = {
  casamento: "Casamento",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  outro: "Outro",
};

type EventStatus = "ativo" | "concluido";
type FilterStatus = "all" | EventStatus;

export const EventsView = () => {
  const { events, loading, createEvent, updateEvent, deleteEvent, refetch } = useEvents();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const handleCreateEvent = async (data: {
    name: string;
    event_date: string;
    event_type: string;
    notes?: string;
  }) => {
    const result = await createEvent(data);
    if (result) {
      setIsFormOpen(false);
    }
  };

  const handleUpdateEvent = async (data: {
    name: string;
    event_date: string;
    event_type: string;
    notes?: string;
  }) => {
    if (!editingEvent) return;
    const result = await updateEvent(editingEvent.id, data);
    if (result) {
      setEditingEvent(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmEvent) return;
    await deleteEvent(deleteConfirmEvent.id);
    setDeleteConfirmEvent(null);
  };

  const handleStatusChange = async (event: Event, newStatus: EventStatus) => {
    await updateEvent(event.id, { status: newStatus });
  };

  const filteredEvents = events.filter((event) => {
    if (filterStatus === "all") return true;
    return (event as Event & { status?: EventStatus }).status === filterStatus;
  });

  // Sort events by date and group by month/year
  const groupedEvents = useMemo(() => {
    const sorted = [...filteredEvents].sort((a, b) => 
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    const groups: Record<string, typeof filteredEvents> = {};
    
    sorted.forEach((event) => {
      const date = parseISO(event.event_date);
      const monthYear = format(date, "MMMM yyyy", { locale: ptBR });
      const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      
      if (!groups[capitalizedMonthYear]) {
        groups[capitalizedMonthYear] = [];
      }
      groups[capitalizedMonthYear].push(event);
    });

    return groups;
  }, [filteredEvents]);

  // If an event is selected, show its detail view
  if (selectedEvent) {
    // Find the latest version of the event from the events array
    const currentEvent = events.find(e => e.id === selectedEvent.id) || selectedEvent;
    
    return (
      <EventDetailView
        event={currentEvent}
        onBack={() => setSelectedEvent(null)}
        onEdit={() => {
          setEditingEvent(currentEvent);
        }}
        onStatusChange={(status) => handleStatusChange(currentEvent, status)}
        onRefresh={async () => {
          await refetch();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Meus Eventos</h2>
          <p className="text-muted-foreground">
            Gerencie seus eventos, tarefas e pagamentos
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="concluido">Concluídos</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {filterStatus === "all" ? "Nenhum evento criado" : `Nenhum evento ${filterStatus}`}
          </h3>
          <p className="text-muted-foreground mb-4">
            {filterStatus === "all"
              ? "Crie seu primeiro evento para começar a organizar seu trabalho"
              : "Altere o filtro para ver outros eventos"}
          </p>
          {filterStatus === "all" && (
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Evento
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear}>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {monthYear}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {monthEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event as Event & { status?: EventStatus; notes?: string }}
                    onClick={() => setSelectedEvent(event)}
                    onEdit={() => setEditingEvent(event)}
                    onDelete={() => setDeleteConfirmEvent(event)}
                    onStatusChange={(status) => handleStatusChange(event, status)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <EventFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateEvent}
      />

      <EventFormModal
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        onSubmit={handleUpdateEvent}
        initialData={editingEvent || undefined}
      />

      <AlertDialog
        open={!!deleteConfirmEvent}
        onOpenChange={(open) => !open && setDeleteConfirmEvent(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento "{deleteConfirmEvent?.name}"?
              Todos os dados do evento serão removidos. Esta ação não pode ser desfeita.
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
};

interface EventCardProps {
  event: Event & { status?: "ativo" | "concluido"; notes?: string; contract_url?: string | null };
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: "ativo" | "concluido") => void;
}

const EventCard = ({ event, onClick, onEdit, onDelete, onStatusChange }: EventCardProps) => {
  const { items } = useChecklistItems(event.id);
  const { payment, getPaymentStatus, getPendingValue } = useEventPayments(event.id);
  const isMobile = useIsMobile();

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const eventDate = parseISO(event.event_date);
  
  // Formato compacto para mobile: "Sáb, 10 Jan 2026"
  // Formato completo para desktop: "10 de jan. de 2026"
  const formattedDate = isMobile
    ? format(eventDate, "EEE, dd MMM yyyy", { locale: ptBR })
    : format(eventDate, "dd 'de' MMM 'de' yyyy", { locale: ptBR });

  const status = event.status || "ativo";
  const isActive = status === "ativo";
  const paymentStatus = getPaymentStatus();
  const pendingValue = getPendingValue();

  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow cursor-pointer group ${
        !isActive ? "opacity-75 bg-muted/30" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            {eventTypeLabels[event.event_type] || event.event_type}
          </span>
          <Badge
            variant={isActive ? "outline" : "secondary"}
            className={`text-xs ${isActive ? "border-warning text-warning" : "border-success text-success"}`}
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
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{event.name}</h3>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Calendar className="h-4 w-4 shrink-0" />
        <span className="capitalize whitespace-nowrap">{formattedDate}</span>
      </div>

      <div className="space-y-3">
        {/* Checklist progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Checklist</span>
            <span className="font-medium">
              {completedCount}/{totalCount}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Payment status */}
        {payment && payment.total_value > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Pagamento
            </div>
            <Badge
              variant="outline"
              className={`text-xs ${
                paymentStatus === "quitado"
                  ? "border-success text-success"
                  : "border-warning text-warning"
              }`}
            >
              {paymentStatus === "quitado"
                ? "Quitado"
                : `R$ ${pendingValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pendente`}
            </Badge>
          </div>
        )}

        {/* Contract indicator */}
        {event.contract_url && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-3 w-3 text-primary" />
            <span className="text-primary font-medium">Contrato anexado</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(isActive ? "concluido" : "ativo");
          }}
        >
          {isActive ? "Concluir" : "Reativar"}
        </Button>
        <div className="flex items-center text-primary">
          <span className="text-sm font-medium">Ver detalhes</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </div>
      </div>
    </Card>
  );
};
