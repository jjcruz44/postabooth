import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Event } from "@/hooks/useEvents";

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; event_date: string; event_type: string }) => void;
  initialData?: Event;
}

const eventTypes = [
  { value: "casamento", label: "Casamento" },
  { value: "corporativo", label: "Corporativo" },
  { value: "aniversario", label: "Aniversário" },
  { value: "formatura", label: "Formatura" },
  { value: "outro", label: "Outro" },
];

export const EventFormModal = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EventFormModalProps) => {
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEventDate(initialData.event_date);
      setEventType(initialData.event_type);
    } else {
      setName("");
      setEventDate("");
      setEventType("");
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !eventDate || !eventType) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name, event_date: eventDate, event_type: eventType });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">Nome do Evento</Label>
            <Input
              id="event-name"
              placeholder="Ex: Casamento Maria e João"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-date">Data do Evento</Label>
            <Input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-type">Tipo de Evento</Label>
            <Select value={eventType} onValueChange={setEventType} required>
              <SelectTrigger id="event-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || !eventDate || !eventType}>
              {isSubmitting ? "Salvando..." : isEditing ? "Salvar" : "Criar Evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
