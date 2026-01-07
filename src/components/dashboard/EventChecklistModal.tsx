import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, Calendar } from "lucide-react";
import { Event, useChecklistItems, ChecklistItem } from "@/hooks/useEvents";
import { cn } from "@/lib/utils";

interface EventChecklistModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const phases = [
  { key: "pre" as const, label: "Pré-evento", color: "bg-blue-500" },
  { key: "during" as const, label: "Durante o evento", color: "bg-amber-500" },
  { key: "post" as const, label: "Pós-evento", color: "bg-green-500" },
];

export const EventChecklistModal = ({
  event,
  open,
  onOpenChange,
}: EventChecklistModalProps) => {
  const { items, loading, addItem, updateItem, deleteItem, toggleItem } =
    useChecklistItems(event?.id || null);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!event) return null;

  const formattedDate = new Date(event.event_date + "T12:00:00").toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{event.name}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </div>
        </DialogHeader>

        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso geral</span>
            <span className="font-semibold text-primary">
              {completedCount} de {totalCount} itens concluídos
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase) => (
              <PhaseSection
                key={phase.key}
                phase={phase}
                items={items.filter((i) => i.phase === phase.key)}
                onAddItem={(text) => addItem(phase.key, text)}
                onToggleItem={toggleItem}
                onUpdateItem={updateItem}
                onDeleteItem={deleteItem}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface PhaseSectionProps {
  phase: { key: "pre" | "during" | "post"; label: string; color: string };
  items: ChecklistItem[];
  onAddItem: (text: string) => Promise<unknown>;
  onToggleItem: (itemId: string) => Promise<boolean>;
  onUpdateItem: (itemId: string, updates: { text?: string }) => Promise<boolean>;
  onDeleteItem: (itemId: string) => Promise<boolean>;
}

const PhaseSection = ({
  phase,
  items,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
}: PhaseSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = items.filter((i) => i.completed).length;

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    setIsAdding(true);
    await onAddItem(newItemText.trim());
    setNewItemText("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-4 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", phase.color)} />
            <span className="font-semibold">{phase.label}</span>
            <span className="text-sm text-muted-foreground">
              ({completedCount}/{items.length})
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4">
        <div className="space-y-2 mb-3">
          {items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onToggle={() => onToggleItem(item.id)}
              onUpdate={(text) => onUpdateItem(item.id, { text })}
              onDelete={() => onDeleteItem(item.id)}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Adicionar novo item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleAddItem}
            disabled={!newItemText.trim() || isAdding}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: () => void;
  onUpdate: (text: string) => void;
  onDelete: () => void;
}

const ChecklistItemRow = ({
  item,
  onToggle,
  onUpdate,
  onDelete,
}: ChecklistItemRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSave = () => {
    if (editText.trim() && editText !== item.text) {
      onUpdate(editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditText(item.text);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
      <Checkbox
        checked={item.completed}
        onCheckedChange={onToggle}
        className="h-5 w-5"
      />

      {isEditing ? (
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 h-8"
          autoFocus
        />
      ) : (
        <span
          className={cn(
            "flex-1 cursor-pointer",
            item.completed && "line-through text-muted-foreground"
          )}
          onClick={() => setIsEditing(true)}
        >
          {item.text}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
