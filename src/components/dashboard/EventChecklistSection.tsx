import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useChecklistItems, ChecklistItem } from "@/hooks/useEvents";

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
  const { items, loading, addItem, updateItem, deleteItem, toggleItem, moveItem } =
    useChecklistItems(eventId);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Progresso geral</span>
          <span className="text-sm text-muted-foreground">
            {completedCount} de {totalCount} itens concluídos
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </Card>

      {/* Phases */}
      <div className="space-y-4">
        {(["pre", "during", "post"] as Phase[]).map((phase) => (
          <PhaseSection
            key={phase}
            phase={phase}
            items={items.filter((i) => i.phase === phase)}
            onAddItem={(text) => addItem(phase, text)}
            onToggleItem={toggleItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onMoveItem={moveItem}
          />
        ))}
      </div>
    </div>
  );
};

interface PhaseSectionProps {
  phase: Phase;
  items: ChecklistItem[];
  onAddItem: (text: string) => Promise<any>;
  onToggleItem: (id: string) => Promise<boolean>;
  onUpdateItem: (id: string, updates: { text?: string }) => Promise<boolean>;
  onDeleteItem: (id: string) => Promise<boolean>;
  onMoveItem: (id: string, direction: "up" | "down") => Promise<boolean>;
}

const PhaseSection = ({
  phase,
  items,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
}: PhaseSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const config = phaseConfig[phase];
  const sortedItems = [...items].sort((a, b) => a.position - b.position);
  const completedCount = items.filter((i) => i.completed).length;

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    setIsAdding(true);
    await onAddItem(newItemText.trim());
    setNewItemText("");
    setIsAdding(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  phase === "pre"
                    ? "bg-warning"
                    : phase === "during"
                    ? "bg-primary"
                    : "bg-success"
                }`}
              />
              <div>
                <h3 className="font-semibold">{config.label}</h3>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {completedCount}/{items.length}
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {sortedItems.map((item, index) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                isFirst={index === 0}
                isLast={index === sortedItems.length - 1}
                onToggle={() => onToggleItem(item.id)}
                onUpdate={(text) => onUpdateItem(item.id, { text })}
                onDelete={() => onDeleteItem(item.id)}
                onMoveUp={() => onMoveItem(item.id, "up")}
                onMoveDown={() => onMoveItem(item.id, "down")}
              />
            ))}

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

interface ChecklistItemRowProps {
  item: ChecklistItem;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onUpdate: (text: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const ChecklistItemRow = ({
  item,
  isFirst,
  isLast,
  onToggle,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ChecklistItemRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== item.text) {
      onUpdate(editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group ${
        item.completed ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

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
