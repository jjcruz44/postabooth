import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Filter,
  Phone,
  Mail,
  Flame,
  Thermometer,
  Snowflake,
  MessageCircle,
  Edit2,
  Trash2,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  Calendar,
  MapPin,
  FileText,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useLeads, Lead, LeadStage, LeadStatus, LeadInput } from "@/hooks/useLeads";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageTemplatesModal } from "./MessageTemplatesModal";
import { SendMessageModal } from "./SendMessageModal";

const stageConfig = {
  quente: {
    label: "Quente",
    icon: Flame,
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    badgeVariant: "destructive" as const,
  },
  morno: {
    label: "Morno",
    icon: Thermometer,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    badgeVariant: "secondary" as const,
  },
  frio: {
    label: "Frio",
    icon: Snowflake,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    badgeVariant: "outline" as const,
  },
};

const leadStatusConfig = {
  lead: {
    label: "Lead",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    cardBorder: "border-l-amber-400",
  },
  cliente: {
    label: "Cliente",
    color: "bg-green-500/10 text-green-600 border-green-500/30",
    cardBorder: "border-l-green-500",
  },
  perdido: {
    label: "Perdido",
    color: "bg-gray-400/10 text-gray-500 border-gray-400/30",
    cardBorder: "border-l-gray-400",
  },
};

const eventTypes = [
  "Casamento",
  "Aniversário",
  "Festa de 15 anos",
  "Formatura",
  "Evento Corporativo",
  "Confraternização",
  "Chá de Bebê",
  "Outro",
];

// Funções para mascarar dados sensíveis
const maskPhone = (phone: string): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length <= 4) return phone;
  // Mostra apenas os 4 últimos dígitos
  return phone.slice(0, -4).replace(/\d/g, "•") + phone.slice(-4);
};

const maskEmail = (email: string): string => {
  if (!email) return "";
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  // Mostra apenas primeira letra e domínio
  const maskedLocal = localPart.charAt(0) + "•".repeat(Math.min(localPart.length - 1, 5));
  return `${maskedLocal}@${domain}`;
};

interface LeadFormProps {
  initialData?: Lead;
  onSubmit: (data: LeadInput) => Promise<void>;
  onClose: () => void;
  isEditing?: boolean;
}

const LeadForm = ({ initialData, onSubmit, onClose, isEditing }: LeadFormProps) => {
  const [formData, setFormData] = useState<LeadInput>({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    event_type: initialData?.event_type || "",
    event_date: initialData?.event_date || "",
    event_city: initialData?.event_city || "",
    stage: initialData?.stage || "morno",
    lead_status: initialData?.lead_status || "lead",
    budget_sent: initialData?.budget_sent || false,
    budget_value: initialData?.budget_value || undefined,
    packages_requested: initialData?.packages_requested || [],
    notes: initialData?.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [newPackage, setNewPackage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    onClose();
  };

  const addPackage = () => {
    if (newPackage.trim()) {
      setFormData((prev) => ({
        ...prev,
        packages_requested: [...(prev.packages_requested || []), newPackage.trim()],
      }));
      setNewPackage("");
    }
  };

  const removePackage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      packages_requested: prev.packages_requested?.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nome do lead"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="email@exemplo.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_type">Tipo de Evento</Label>
          <Select
            value={formData.event_type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, event_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date">Data do Evento</Label>
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, event_date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_city">Cidade do Evento</Label>
          <Input
            id="event_city"
            value={formData.event_city}
            onChange={(e) => setFormData((prev) => ({ ...prev, event_city: e.target.value }))}
            placeholder="São Paulo, SP"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Estágio</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(stageConfig) as LeadStage[]).map((stage) => {
            const config = stageConfig[stage];
            const Icon = config.icon;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, stage }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  formData.stage === stage
                    ? config.color + " border-current"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Orçamento
        </h4>

        <div className="flex items-center gap-3">
          <Checkbox
            id="budget_sent"
            checked={formData.budget_sent}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, budget_sent: checked as boolean }))
            }
          />
          <Label htmlFor="budget_sent" className="cursor-pointer">
            Orçamento enviado
          </Label>
        </div>

        {formData.budget_sent && (
          <div className="space-y-2">
            <Label htmlFor="budget_value">Valor do Orçamento (R$)</Label>
            <Input
              id="budget_value"
              type="number"
              value={formData.budget_value || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  budget_value: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
              placeholder="0,00"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Pacotes Solicitados</Label>
          <div className="flex gap-2">
            <Input
              value={newPackage}
              onChange={(e) => setNewPackage(e.target.value)}
              placeholder="Nome do pacote"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPackage();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addPackage}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.packages_requested && formData.packages_requested.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.packages_requested.map((pkg, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => removePackage(index)}
                >
                  <Package className="w-3 h-3" />
                  {pkg}
                  <span className="text-xs ml-1">×</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Anotações sobre o lead..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.name.trim()}>
          {loading ? "Salvando..." : isEditing ? "Salvar" : "Adicionar Lead"}
        </Button>
      </div>
    </form>
  );
};

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onUpdateStage: (id: string, stage: LeadStage) => void;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onSendMessage: (lead: Lead) => void;
}

const LeadCard = ({ lead, onEdit, onDelete, onUpdateStage, onUpdateStatus, onSendMessage }: LeadCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const config = stageConfig[lead.stage];
  const Icon = config.icon;
  const statusConfig = leadStatusConfig[lead.lead_status || "lead"];

  const openWhatsAppQuick = () => {
    if (!lead.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá ${lead.name}! Tudo bem? Estou entrando em contato sobre seu interesse em nosso serviço de cabine/totem fotográfico.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-card border border-border rounded-xl overflow-hidden border-l-4 ${statusConfig.cardBorder}`}
    >
      <div className="p-4">
        {/* Status selector */}
        <div className="flex items-center justify-between mb-3">
          <Select
            value={lead.lead_status || "lead"}
            onValueChange={(value) => onUpdateStatus(lead.id, value as LeadStatus)}
          >
            <SelectTrigger className={`w-[120px] h-7 text-xs ${statusConfig.color}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Lead
                </span>
              </SelectItem>
              <SelectItem value="cliente">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Cliente
                </span>
              </SelectItem>
              <SelectItem value="perdido">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Perdido
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
              <Badge variant={config.badgeVariant} className="shrink-0">
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>

            {(lead.event_type || lead.event_date || lead.event_city) && (
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                {lead.event_type && <span>{lead.event_type}</span>}
                {lead.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(lead.event_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
                {lead.event_city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {lead.event_city}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {lead.phone && (
                <span className="flex items-center gap-1" title="Telefone mascarado por segurança">
                  <Phone className="w-3 h-3" />
                  {maskPhone(lead.phone)}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1 truncate" title="E-mail mascarado por segurança">
                  <Mail className="w-3 h-3" />
                  {maskEmail(lead.email)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {lead.phone && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSendMessage(lead)}
                  className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                  title="Enviar mensagem com template"
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openWhatsAppQuick}
                  className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                  title="WhatsApp rápido"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => onEdit(lead)} title="Editar">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(lead)}
              className="text-destructive hover:text-destructive"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Budget & Packages indicator */}
        {(lead.budget_sent || (lead.packages_requested && lead.packages_requested.length > 0)) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {lead.budget_sent && (
              <Badge variant="outline" className="text-green-600 border-green-600/30">
                <DollarSign className="w-3 h-3 mr-1" />
                {lead.budget_value
                  ? `R$ ${lead.budget_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "Orçamento enviado"}
              </Badge>
            )}
            {lead.packages_requested && lead.packages_requested.length > 0 && (
              <Badge variant="outline">
                <Package className="w-3 h-3 mr-1" />
                {lead.packages_requested.length} pacote(s)
              </Badge>
            )}
          </div>
        )}

        {/* Expandable section */}
        {(lead.notes || (lead.packages_requested && lead.packages_requested.length > 0)) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Menos detalhes" : "Mais detalhes"}
          </button>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-border space-y-2">
                {lead.packages_requested && lead.packages_requested.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Pacotes:</p>
                    <div className="flex flex-wrap gap-1">
                      {lead.packages_requested.map((pkg, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {pkg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {lead.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Observações:</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick stage change */}
        <div className="flex gap-1 mt-3 pt-3 border-t border-border">
          {(Object.keys(stageConfig) as LeadStage[]).map((stage) => {
            const cfg = stageConfig[stage];
            const StageIcon = cfg.icon;
            return (
              <button
                key={stage}
                onClick={() => onUpdateStage(lead.id, stage)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs transition-all ${
                  lead.stage === stage
                    ? cfg.color + " font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <StageIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export const LeadsView = () => {
  const { leads, loading, addLead, updateLead, deleteLead, updateStage, updateLeadStatus, stats } = useLeads();
  const [filterStage, setFilterStage] = useState<LeadStage | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [sendingMessageLead, setSendingMessageLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const matchesStage = filterStage === "all" || lead.stage === filterStage;
    const matchesSearch =
      searchQuery === "" ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.event_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const handleSubmit = async (data: LeadInput) => {
    if (editingLead) {
      await updateLead(editingLead.id, data);
    } else {
      await addLead(data);
    }
    setEditingLead(null);
  };

  const handleDelete = async () => {
    if (deletingLead) {
      await deleteLead(deletingLead.id);
      setDeletingLead(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.quente}</p>
                <p className="text-xs text-muted-foreground">Quentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{stats.morno}</p>
                <p className="text-xs text-muted-foreground">Mornos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Snowflake className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{stats.frio}</p>
                <p className="text-xs text-muted-foreground">Frios</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={filterStage}
            onValueChange={(value) => setFilterStage(value as LeadStage | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="quente">🔥 Quentes</SelectItem>
              <SelectItem value="morno">🌡️ Mornos</SelectItem>
              <SelectItem value="frio">❄️ Frios</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setIsTemplatesOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Templates</span>
          </Button>

          <Dialog open={isFormOpen || !!editingLead} onOpenChange={(open) => {
            if (!open) {
              setIsFormOpen(false);
              setEditingLead(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Novo Lead</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLead ? "Editar Lead" : "Adicionar Novo Lead"}
                </DialogTitle>
              </DialogHeader>
              <LeadForm
                initialData={editingLead || undefined}
                onSubmit={handleSubmit}
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingLead(null);
                }}
                isEditing={!!editingLead}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando leads...</p>
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || filterStage !== "all"
                ? "Nenhum lead encontrado"
                : "Nenhum lead cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStage !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Adicione seu primeiro lead para começar a gerenciar seus contatos"}
            </p>
            {!searchQuery && filterStage === "all" && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Lead
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={setEditingLead}
                onDelete={setDeletingLead}
                onUpdateStage={updateStage}
                onUpdateStatus={updateLeadStatus}
                onSendMessage={setSendingMessageLead}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLead} onOpenChange={(open) => !open && setDeletingLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead "{deletingLead?.name}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Templates Modal */}
      <MessageTemplatesModal open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen} />

      {/* Send Message Modal */}
      {sendingMessageLead && (
        <SendMessageModal
          open={!!sendingMessageLead}
          onOpenChange={(open) => !open && setSendingMessageLead(null)}
          lead={sendingMessageLead}
        />
      )}
    </div>
  );
};
