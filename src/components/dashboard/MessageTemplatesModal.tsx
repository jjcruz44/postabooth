import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  DollarSign,
  MessageSquare,
  Tag,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useMessageTemplates,
  MessageTemplate,
  TemplateCategory,
  TemplateInput,
} from "@/hooks/useMessageTemplates";

const categoryConfig = {
  orcamento: {
    label: "Orçamento",
    icon: DollarSign,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  "follow-up": {
    label: "Follow-up",
    icon: MessageSquare,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  promocao: {
    label: "Promoção",
    icon: Tag,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
};

interface TemplateFormProps {
  initialData?: MessageTemplate;
  onSubmit: (data: TemplateInput) => Promise<void>;
  onClose: () => void;
}

const TemplateForm = ({ initialData, onSubmit, onClose }: TemplateFormProps) => {
  const [formData, setFormData] = useState<TemplateInput>({
    name: initialData?.name || "",
    category: initialData?.category || "follow-up",
    content: initialData?.content || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) return;

    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    onClose();
  };

  const variables = [
    { key: "{{nome}}", desc: "Nome do lead" },
    { key: "{{evento}}", desc: "Tipo do evento" },
    { key: "{{data}}", desc: "Data do evento" },
    { key: "{{cidade}}", desc: "Cidade do evento" },
    { key: "{{valor}}", desc: "Valor do orçamento" },
  ];

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + variable,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Template *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Primeiro contato"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, category: value as TemplateCategory }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Mensagem *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="Digite sua mensagem..."
          rows={5}
          required
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs text-muted-foreground mr-1">Variáveis:</span>
          {variables.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              title={v.desc}
            >
              {v.key}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim() || !formData.content.trim()}
        >
          {loading ? "Salvando..." : initialData ? "Salvar" : "Criar Template"}
        </Button>
      </div>
    </form>
  );
};

interface MessageTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MessageTemplatesModal = ({ open, onOpenChange }: MessageTemplatesModalProps) => {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } =
    useMessageTemplates();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<MessageTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<TemplateCategory | "all">("all");

  const filteredTemplates =
    activeTab === "all"
      ? templates
      : templates.filter((t) => t.category === activeTab);

  const handleSubmit = async (data: TemplateInput) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, data);
    } else {
      await addTemplate(data);
    }
    setEditingTemplate(null);
  };

  const handleDelete = async () => {
    if (deletingTemplate) {
      await deleteTemplate(deletingTemplate.id);
      setDeletingTemplate(null);
    }
  };

  const copyTemplate = (template: MessageTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Copiado!",
      description: "Template copiado para a área de transferência.",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates de Mensagens
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TemplateCategory | "all")}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
                  <TabsTrigger value="follow-up">Follow-up</TabsTrigger>
                  <TabsTrigger value="promocao">Promoção</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                size="sm"
                onClick={() => setIsFormOpen(true)}
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum template encontrado.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Template
                  </Button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.map((template) => {
                    const config = categoryConfig[template.category];
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={template.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-muted/50 rounded-lg p-4 border border-border"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h4 className="font-medium truncate">
                                {template.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className={config.color}
                              >
                                <Icon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {template.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyTemplate(template)}
                              title="Copiar"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingTemplate(template)}
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingTemplate(template)}
                              className="text-destructive hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Form Modal */}
      <Dialog
        open={isFormOpen || !!editingTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingTemplate(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>
          <TemplateForm
            initialData={editingTemplate || undefined}
            onSubmit={handleSubmit}
            onClose={() => {
              setIsFormOpen(false);
              setEditingTemplate(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{deletingTemplate?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
