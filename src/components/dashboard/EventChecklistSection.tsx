import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, Copy, Clipboard, GripVertical, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useChecklistItems, ChecklistItem, useEvents } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";
import { CopyChecklistModal } from "./CopyChecklistModal";
import { ChecklistTemplate } from "@/data/checklistTemplates";
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

interface EventChecklistSectionProps {
  eventId: string;
}

type Phase = "pre" | "during" | "post";

const phaseConfig: Record<Phase, { label: string; description: string }> = {
  pre: { label: "Pré-evento", description: "Tarefas antes do evento" },
  during: { label: "Durante o evento", description: "Tarefas no dia do evento" },
  post: { label: "Pós-evento", description: "Tarefas após o evento" },
};

export const EventChecklistSection = ({ eventId }: EventChecklistSectionProps) => {
  const { toast } = useToast();
  const { events } = useEvents();
  const {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    reorderItems,
    deleteAllItems,
    addBulkItems,
    copyFromEvent,
  } = useChecklistItems(eventId);

  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const hasChecklist = totalCount > 0;

  const handleApplyTemplate = async (
    template: ChecklistTemplate,
    mode: "replace" | "add"
  ) => {
    if (mode === "replace") {
      await deleteAllItems();
    }
    const success = await addBulkItems(template.items);
    if (success) {
      toast({
        title: "Template aplicado",
        description: `${template.items.length} itens adicionados ao checklist.`,
      });
    }
  };

  const handleCopyFromEvent = async (
    sourceEventId: string,
    mode: "replace" | "add"
  ) => {
    const sourceItems = await copyFromEvent(sourceEventId);
    if (!sourceItems || sourceItems.length === 0) {
      toast({
        title: "Aviso",
        description: "O evento selecionado não possui itens no checklist.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "replace") {
      await deleteAllItems();
    }
    const success = await addBulkItems(sourceItems);
    if (success) {
      toast({
        title: "Checklist copiado",
        description: `${sourceItems.length} itens copiados do evento anterior.`,
      });
    }
  };

  const handleCreateFromScratch = () => {
    addItem("pre", "Primeira tarefa do evento");
    toast({
      title: "Checklist criado",
      description: "Seu checklist foi iniciado. Adicione mais itens conforme necessário.",
    });
  };

  const handleDeleteChecklist = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteAllItems();
      if (success) {
        toast({
          title: "Checklist excluído",
          description: "Todos os itens do checklist foram removidos.",
        });
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Empty state - no checklist yet
  if (!hasChecklist) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <Clipboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum checklist criado</h3>
          <p className="text-muted-foreground mb-6">
            Crie um checklist do zero ou copie de um template ou evento existente
          </p>
          
          <div className="grid gap-3 max-w-md mx-auto">
            <Card
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary text-left"
              onClick={handleCreateFromScratch}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Criar do zero</h4>
                  <p className="text-sm text-muted-foreground">
                    Comece um checklist vazio e adicione seus próprios itens
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary text-left"
              onClick={() => setCopyModalOpen(true)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary/50 rounded-lg shrink-0">
                  <Copy className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">Copiar checklist</h4>
                  <p className="text-sm text-muted-foreground">
                    Use um template pronto ou copie de outro evento
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        <CopyChecklistModal
          open={copyModalOpen}
          onOpenChange={setCopyModalOpen}
          currentEventId={eventId}
          currentItemsCount={0}
          events={events}
          onApplyTemplate={handleApplyTemplate}
          onCopyFromEvent={handleCopyFromEvent}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress summary with actions */}
      <Card className={`p-4 ${progress === 100 ? "border-green-500/50 bg-green-500/5" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {progress === 100 && (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Progresso geral</span>
                {progress === 100 && (
                  <span className="text-xs text-green-600 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">Concluído!</span>
                )}
              </div>
              <span className={`text-sm ${progress === 100 ? "text-green-600" : "text-muted-foreground"}`}>
                {completedCount} de {totalCount} itens concluídos
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${progress === 100 ? "text-green-600" : "text-foreground"}`}>
              {Math.round(progress)}%
            </span>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCopyModalOpen(true)}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copiar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Phases */}
      <div className="space-y-4">
        {(["pre", "during", "post"] as Phase[]).map((phase) => (
          <PhaseSection
            key={phase}
            phase={phase}
            eventId={eventId}
            items={items.filter((i) => i.phase === phase)}
            onAddItem={(text) => addItem(phase, text)}
            onToggleItem={toggleItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onReorderItems={(reorderedIds) => reorderItems(phase, reorderedIds)}
          />
        ))}
      </div>

      {/* Copy Modal */}
      <CopyChecklistModal
        open={copyModalOpen}
        onOpenChange={setCopyModalOpen}
        currentEventId={eventId}
        currentItemsCount={items.length}
        events={events}
        onApplyTemplate={handleApplyTemplate}
        onCopyFromEvent={handleCopyFromEvent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir checklist?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir todo o checklist deste evento?
              Esta ação irá remover todos os {totalCount} itens e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChecklist}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir checklist"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface PhaseSectionProps {
  phase: Phase;
  eventId: string;
  items: ChecklistItem[];
  onAddItem: (text: string) => Promise<any>;
  onToggleItem: (id: string) => Promise<boolean>;
  onUpdateItem: (id: string, updates: { text?: string }) => Promise<boolean>;
  onDeleteItem: (id: string) => Promise<boolean>;
  onReorderItems: (reorderedIds: string[]) => Promise<boolean>;
}

const getCollapseStorageKey = (eventId: string, phase: Phase) => 
  `checklist-collapse-${eventId}-${phase}`;

const PhaseSection = ({
  phase,
  eventId,
  items,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
}: PhaseSectionProps) => {
  const storageKey = getCollapseStorageKey(eventId, phase);
  
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? saved === "true" : true;
  });
  const [newItemText, setNewItemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem(storageKey, String(isOpen));
  }, [isOpen, storageKey]);

  const config = phaseConfig[phase];
  const sortedItems = [...items].sort((a, b) => a.position - b.position);
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = totalCount > 0 && progress === 100;
  const hasItems = totalCount > 0;

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sortedItems, oldIndex, newIndex);
        const reorderedIds = reordered.map((item) => item.id);
        await onReorderItems(reorderedIds);
      }
    }
  };

  const activeItem = activeId ? sortedItems.find((item) => item.id === activeId) : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`overflow-hidden ${isComplete ? "border-green-500/50" : ""}`}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      phase === "pre"
                        ? "bg-warning"
                        : phase === "during"
                        ? "bg-primary"
                        : "bg-success"
                    }`}
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{config.label}</h3>
                    {isComplete && (
                      <span className="text-xs text-green-600 font-medium">Concluído</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasItems ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {completedCount}/{totalCount}
                    </span>
                    <span className={`text-lg font-bold ${isComplete ? "text-green-600" : "text-foreground"}`}>
                      {progress}%
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Sem itens</span>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedItems.map((item) => (
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
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-card border-2 border-primary shadow-lg">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Checkbox checked={activeItem.completed} className="shrink-0" />
                    <span className={`flex-1 text-sm ${activeItem.completed ? "line-through text-muted-foreground" : ""}`}>
                      {activeItem.text}
                    </span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* Add new item */}
            <div className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Adicionar novo item..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                disabled={isAdding}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="secondary"
                onClick={handleAddItem}
                disabled={!newItemText.trim() || isAdding}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
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

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== item.text) {
      onUpdate(editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group ${
        item.completed ? "opacity-60" : ""
      } ${isDragging ? "opacity-50 bg-muted" : ""}`}
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
        className="shrink-0"
      />

      {isEditing ? (
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveEdit();
            if (e.key === "Escape") {
              setEditText(item.text);
              setIsEditing(false);
            }
          }}
          autoFocus
          className="flex-1 h-8"
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-pointer ${
            item.completed ? "line-through text-muted-foreground" : ""
          }`}
          onClick={() => setIsEditing(true)}
        >
          {item.text}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
