import { useState, useMemo } from "react";
import { Send, MessageCircle, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMessageTemplates, MessageTemplate } from "@/hooks/useMessageTemplates";
import { Lead } from "@/hooks/useLeads";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export const SendMessageModal = ({ open, onOpenChange, lead }: SendMessageModalProps) => {
  const { templates, loading } = useMessageTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");

  // Process template with lead data
  const processTemplate = (content: string): string => {
    let processed = content;
    
    processed = processed.replace(/\{\{nome\}\}/gi, lead.name || "");
    processed = processed.replace(/\{\{evento\}\}/gi, lead.event_type || "evento");
    processed = processed.replace(
      /\{\{data\}\}/gi,
      lead.event_date
        ? ` no dia ${format(new Date(lead.event_date), "dd 'de' MMMM", { locale: ptBR })}`
        : ""
    );
    processed = processed.replace(
      /\{\{cidade\}\}/gi,
      lead.event_city || ""
    );
    processed = processed.replace(
      /\{\{valor\}\}/gi,
      lead.budget_value
        ? `R$ ${lead.budget_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : ""
    );
    
    return processed;
  };

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId);
  }, [templates, selectedTemplateId]);

  const processedMessage = useMemo(() => {
    if (selectedTemplate) {
      return processTemplate(selectedTemplate.content);
    }
    return customMessage;
  }, [selectedTemplate, customMessage, lead]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setCustomMessage(processTemplate(template.content));
    }
  };

  const openWhatsApp = () => {
    if (!lead.phone) return;
    
    const cleanPhone = lead.phone.replace(/\D/g, "");
    const message = encodeURIComponent(customMessage || processedMessage);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
    onOpenChange(false);
  };

  const canSend = lead.phone && (customMessage.trim() || processedMessage.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            Enviar Mensagem para {lead.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!lead.phone && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              Este lead não possui telefone cadastrado.
            </div>
          )}

          <div className="space-y-2">
            <Label>Usar Template</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={handleSelectTemplate}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (mensagem personalizada)</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {template.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={customMessage || processedMessage}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                setSelectedTemplateId("");
              }}
              placeholder="Digite sua mensagem..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              As variáveis foram substituídas pelos dados do lead.
            </p>
          </div>

          {/* Preview info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium text-foreground">Dados do Lead:</p>
            <div className="grid grid-cols-2 gap-1 text-muted-foreground">
              <span>Nome: {lead.name}</span>
              <span>Telefone: {lead.phone || "N/A"}</span>
              <span>Evento: {lead.event_type || "N/A"}</span>
              <span>Cidade: {lead.event_city || "N/A"}</span>
              {lead.event_date && (
                <span>
                  Data: {format(new Date(lead.event_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
              {lead.budget_value && (
                <span>
                  Orçamento: R$ {lead.budget_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={openWhatsApp}
              disabled={!canSend}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar via WhatsApp
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
