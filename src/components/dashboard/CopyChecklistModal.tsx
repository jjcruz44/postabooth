import { useState } from "react";
import { Copy, FileText, Calendar, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checklistTemplates, ChecklistTemplate } from "@/data/checklistTemplates";
import { Event } from "@/hooks/useEvents";

type Step = "choose-source" | "select-template" | "select-event" | "confirm-action";
type CopyMode = "replace" | "add";

interface CopyChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEventId: string;
  currentItemsCount: number;
  events: Event[];
  onApplyTemplate: (template: ChecklistTemplate, mode: CopyMode) => Promise<void>;
  onCopyFromEvent: (sourceEventId: string, mode: CopyMode) => Promise<void>;
}

export const CopyChecklistModal = ({
  open,
  onOpenChange,
  currentEventId,
  currentItemsCount,
  events,
  onApplyTemplate,
  onCopyFromEvent,
}: CopyChecklistModalProps) => {
  const [step, setStep] = useState<Step>("choose-source");
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [copyMode, setCopyMode] = useState<CopyMode>("replace");
  const [loading, setLoading] = useState(false);

  const otherEvents = events.filter((e) => e.id !== currentEventId);
  const hasExistingItems = currentItemsCount > 0;

  const handleClose = () => {
    setStep("choose-source");
    setSelectedTemplate(null);
    setSelectedEventId(null);
    setCopyMode("replace");
    onOpenChange(false);
  };

  const handleSelectSource = (source: "template" | "event") => {
    if (source === "template") {
      setStep("select-template");
    } else {
      setStep("select-event");
    }
  };

  const handleSelectTemplate = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    if (hasExistingItems) {
      setStep("confirm-action");
    } else {
      handleApply(template, null, "replace");
    }
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    if (hasExistingItems) {
      setStep("confirm-action");
    } else {
      handleApply(null, eventId, "replace");
    }
  };

  const handleApply = async (
    template: ChecklistTemplate | null,
    eventId: string | null,
    mode: CopyMode
  ) => {
    setLoading(true);
    try {
      if (template) {
        await onApplyTemplate(template, mode);
      } else if (eventId) {
        await onCopyFromEvent(eventId, mode);
      }
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = () => {
    handleApply(selectedTemplate, selectedEventId, copyMode);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copiar Checklist
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Choose source */}
        {step === "choose-source" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Escolha como deseja preencher o checklist deste evento:
            </p>
            <div className="grid gap-3">
              <Card
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary"
                onClick={() => handleSelectSource("template")}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Aplicar checklist pronto (Template)</h4>
                    <p className="text-sm text-muted-foreground">
                      Use um modelo pré-definido para o tipo de evento
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-4 transition-colors border-2 ${
                  otherEvents.length > 0
                    ? "cursor-pointer hover:bg-muted/50 hover:border-primary"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => otherEvents.length > 0 && handleSelectSource("event")}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">Copiar de evento anterior</h4>
                    <p className="text-sm text-muted-foreground">
                      {otherEvents.length > 0
                        ? "Copie o checklist de outro evento seu"
                        : "Você ainda não tem outros eventos"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2a: Select Template */}
        {step === "select-template" && (
          <div className="space-y-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("choose-source")}
              className="mb-2"
            >
              ← Voltar
            </Button>
            <p className="text-sm text-muted-foreground">
              Selecione um template para aplicar:
            </p>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {checklistTemplates.map((template) => {
                  const preCount = template.items.filter((i) => i.phase === "pre").length;
                  const duringCount = template.items.filter((i) => i.phase === "during").length;
                  const postCount = template.items.filter((i) => i.phase === "post").length;

                  return (
                    <Card
                      key={template.id}
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border hover:border-primary"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {template.items.length} itens
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          Pré: {preCount}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Durante: {duringCount}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Pós: {postCount}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 2b: Select Event */}
        {step === "select-event" && (
          <div className="space-y-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("choose-source")}
              className="mb-2"
            >
              ← Voltar
            </Button>
            <p className="text-sm text-muted-foreground">
              Selecione o evento para copiar o checklist:
            </p>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {otherEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border hover:border-primary"
                    onClick={() => handleSelectEvent(event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{event.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.event_date)}
                        </p>
                      </div>
                      <Badge
                        variant={event.status === "ativo" ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {event.status === "ativo" ? "Ativo" : "Concluído"}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 3: Confirm action when items exist */}
        {step === "confirm-action" && (
          <div className="space-y-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setStep(selectedTemplate ? "select-template" : "select-event")
              }
              className="mb-2"
            >
              ← Voltar
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este evento já possui <strong>{currentItemsCount} itens</strong> no
                checklist. O que deseja fazer?
              </AlertDescription>
            </Alert>

            <RadioGroup
              value={copyMode}
              onValueChange={(value) => setCopyMode(value as CopyMode)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="replace" id="replace" className="mt-0.5" />
                <Label htmlFor="replace" className="cursor-pointer flex-1">
                  <span className="font-medium">Substituir checklist atual</span>
                  <p className="text-sm text-muted-foreground">
                    Remove todos os itens existentes e aplica o novo checklist
                  </p>
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="add" id="add" className="mt-0.5" />
                <Label htmlFor="add" className="cursor-pointer flex-1">
                  <span className="font-medium">Adicionar ao checklist atual</span>
                  <p className="text-sm text-muted-foreground">
                    Mantém os itens existentes e adiciona os novos
                  </p>
                </Label>
              </div>
            </RadioGroup>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmAction} disabled={loading}>
                {loading ? "Aplicando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
