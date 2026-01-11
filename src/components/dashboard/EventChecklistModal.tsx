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
import { Plus, Trash2, ChevronDown, Calendar, GripVertical } from "lucide-react";
import { Event, useChecklistItems, ChecklistItem } from "@/hooks/useEvents";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  const { items, loading, addItem, updateItem, deleteItem, toggleItem, reorderItems } =
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
          <Progress value={progress} className="h-3 [&>div]:bg-green-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase) => {
              const phaseItems = items
                .filter((i) => i.phase === phase.key)
                .sort((a, b) => a.position - b.position);
              return (
                <PhaseSection
                  key={phase.key}
                  phase={phase}
                  items={phaseItems}
                  onAddItem={(text) => addItem(phase.key, text)}
                  onToggleItem={toggleItem}
                  onUpdateItem={updateItem}
                  onDeleteItem={deleteItem}
                  onReorderItems={(reorderedIds) => reorderItems(phase.key, reorderedIds)}
                />
              );
            })}
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
  onReorderItems: (reorderedIds: string[]) => Promise<boolean>;
}

const PhaseSection = ({
  phase,
  items,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
}: PhaseSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const completedCount = items.filter((i) => i.completed).length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        const reorderedIds = reordered.map((item) => item.id);
        await onReorderItems(reorderedIds);
      }
    }
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={() => onToggleItem(item.id)}
                  onUpdate={(text) => onUpdateItem(item.id, { text })}
                  onDelete={() => onDeleteItem(item.id)}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeItem ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-card border-2 border-primary shadow-lg">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Checkbox checked={activeItem.completed} className="h-5 w-5" />
                  <span className={cn("flex-1", activeItem.completed && "line-through text-muted-foreground")}>
                    {activeItem.text}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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

interface SortableChecklistItemProps {
  item: ChecklistItem;
  onToggle: () => void;
  onUpdate: (text: string) => void;
  onDelete: () => void;
}

const SortableChecklistItem = ({
  item,
  onToggle,
  onUpdate,
  onDelete,
}: SortableChecklistItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group",
        isDragging && "opacity-50 bg-muted"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded transition-colors"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

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
