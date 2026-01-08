import { useState, useEffect } from "react";
import { DollarSign, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useEventPayments } from "@/hooks/useEventPayments";
import { useToast } from "@/hooks/use-toast";

interface EventPaymentSectionProps {
  eventId: string;
}

export const EventPaymentSection = ({ eventId }: EventPaymentSectionProps) => {
  const { payment, loading, createOrUpdatePayment, getPaymentStatus, getPendingValue } =
    useEventPayments(eventId);
  const { toast } = useToast();

  const [totalValue, setTotalValue] = useState("");
  const [receivedValue, setReceivedValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync form with payment data
  useEffect(() => {
    if (payment) {
      setTotalValue(payment.total_value.toString());
      setReceivedValue(payment.received_value.toString());
    } else {
      setTotalValue("");
      setReceivedValue("");
    }
  }, [payment]);

  const handleSave = async () => {
    const total = parseFloat(totalValue) || 0;
    const received = parseFloat(receivedValue) || 0;

    if (total < 0 || received < 0) {
      toast({
        title: "Valores inválidos",
        description: "Os valores não podem ser negativos.",
        variant: "destructive",
      });
      return;
    }

    if (received > total) {
      toast({
        title: "Valor recebido maior que o total",
        description: "O valor recebido não pode ser maior que o valor total.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const result = await createOrUpdatePayment({
      total_value: total,
      received_value: received,
    });
    setIsSaving(false);

    if (result) {
      toast({
        title: "Pagamento salvo",
        description: "Os dados do pagamento foram atualizados.",
      });
    }
  };

  const paymentStatus = getPaymentStatus();
  const pendingValue = getPendingValue();

  // Calculate live pending value from form
  const liveTotalValue = parseFloat(totalValue) || 0;
  const liveReceivedValue = parseFloat(receivedValue) || 0;
  const livePendingValue = Math.max(0, liveTotalValue - liveReceivedValue);
  const liveStatus = liveReceivedValue >= liveTotalValue && liveTotalValue > 0 ? "quitado" : "pendente";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status card */}
      <Card
        className={`p-6 ${
          liveStatus === "quitado"
            ? "border-success/50 bg-success/5"
            : liveTotalValue > 0
            ? "border-warning/50 bg-warning/5"
            : ""
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Status do Pagamento</h3>
          </div>
          {liveTotalValue > 0 && (
            <Badge
              variant="outline"
              className={`${
                liveStatus === "quitado"
                  ? "border-success text-success"
                  : "border-warning text-warning"
              }`}
            >
              {liveStatus === "quitado" ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Quitado
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pendente
                </>
              )}
            </Badge>
          )}
        </div>

        {liveTotalValue > 0 && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
              <p className="text-lg font-bold">
                R$ {liveTotalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recebido</p>
              <p className="text-lg font-bold text-success">
                R$ {liveReceivedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pendente</p>
              <p className={`text-lg font-bold ${livePendingValue > 0 ? "text-warning" : "text-success"}`}>
                R$ {livePendingValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {liveTotalValue === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Preencha os valores abaixo para acompanhar o pagamento deste evento.
          </p>
        )}
      </Card>

      {/* Form */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Dados do Pagamento</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="totalValue">Valor Total do Evento (R$)</Label>
            <Input
              id="totalValue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receivedValue">Valor Recebido (R$)</Label>
            <Input
              id="receivedValue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={receivedValue}
              onChange={(e) => setReceivedValue(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Pagamento"}
          </Button>
        </div>
      </Card>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        O status do pagamento é calculado automaticamente: <strong>Pendente</strong> quando o
        valor recebido é menor que o total, e <strong>Quitado</strong> quando são iguais.
      </p>
    </div>
  );
};
