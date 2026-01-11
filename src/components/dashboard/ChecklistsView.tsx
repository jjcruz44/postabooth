import { useState } from "react";
import { Plus, Calendar, ChevronRight, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEvents, Event, useChecklistItems } from "@/hooks/useEvents";
import { EventFormModal } from "./EventFormModal";
import { EventChecklistModal } from "./EventChecklistModal";
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

const eventTypeLabels: Record<string, string> = {
  casamento: "Casamento",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  formatura: "Formatura",
  outro: "Outro",
};

export const ChecklistsView = () => {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);

  const handleCreateEvent = async (data: {
    name: string;
    event_date: string;
    event_type: string;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Checklists de Evento</h2>
          <p className="text-muted-foreground">
            Organize suas tarefas antes, durante e após cada evento
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum evento criado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro evento para começar a organizar suas tarefas
          </p>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Evento
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setSelectedEvent(event)}
              onEdit={() => setEditingEvent(event)}
              onDelete={() => setDeleteConfirmEvent(event)}
            />
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

      <EventChecklistModal
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
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
              Todos os itens do checklist serão removidos. Esta ação não pode ser desfeita.
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
  event: Event;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const EventCard = ({ event, onClick, onEdit, onDelete }: EventCardProps) => {
  const { items } = useChecklistItems(event.id);
  
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const formattedDate = new Date(event.event_date + "T12:00:00").toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            {eventTypeLabels[event.event_type] || event.event_type}
          </span>
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

      <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
        {event.name}
      </h3>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Calendar className="h-4 w-4" />
        {formattedDate}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">
            {completedCount} de {totalCount} itens
          </span>
        </div>
        <Progress value={progress} className="h-2 [&>div]:bg-green-500" />
      </div>

      <div className="flex items-center justify-end mt-4 text-primary">
        <span className="text-sm font-medium">Ver checklist</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </div>
    </Card>
  );
};
